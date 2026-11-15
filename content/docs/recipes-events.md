# Recipes: events and hooks

React to what happens in the game: a player joins, a block breaks, a mob dies, a second passes. Each recipe is a method you add to your mod's `impl Hooks`.

Every recipe here needs the Rust part of a mod: start with `cargo horizon-mod new my_mod --template native`, or add code to a mod you have ([Add code to your mod](/docs/mod-code)). The snippets use Sunrise's mod API; Sunrise's launcher compiles a native mod against the pinned prebuilt game.

> [!NOTE] Checked against the mod API at [arismoko/horizon `de8b4e2`](https://github.com/arismoko/horizon/tree/de8b4e2526df9d7f611515b78123a26a3914176f), which Sunrise merges. The Rust recipes below were compile-checked together against `horizon-mod-api`; they were not tested in game.

## How a hook works

Your mod has **one** `impl Hooks` block, marked `#[mod_api::horizon_mod]`. Each method you write in it is a hook the game calls. You only write the ones you need.

```rust
use mod_api::*;

#[derive(Default)]
struct Mod;

#[mod_api::horizon_mod]
impl Hooks for Mod {
    // Paste hook methods here. Recipes with their own Mod replace this scaffold.
}
```

Hooks come in a few shapes. Check the return type and the event fields:

- **Notice hooks:** nothing is returned; a non-cancellable notice cannot stop the action. Other hooks may let you edit the event even without a return value.
- **`Flow`:** return `Flow::Cancel` to stop what is happening, or `Flow::Continue` to allow it unless another listener cancels.
- **Replacement hooks returning `Option<...>`:** return `Some(answer)` to decide, or `None` to leave it to the next mod and then the game.

These recipes use side-specific hosts. A **server** hook gets `host: &mut dyn ServerHost`, a **client** hook a `ClientHost`, and a hook that runs on **both** a `HostSide` you `match` on. Some hooks use a shared or level host instead; check the hook's signature. The compiler stops a server hook from calling client-only code.

> [!TIP] One hook, several mods
> Many mods can listen to the same hook. `#[listener(priority = 10)]` above a method runs it before the default 0. `#[listener(receive_cancelled)]` lets it see events an earlier mod cancelled.

## Greet a player who joins

**Status:** Works today.

**You get:** a welcome chat line for each connected player who joins, and a line for everyone when they leave.

```rust
// A player joined. Server-side.
fn player_logged_in(&self, host: &mut dyn ServerHost, event: &mut PlayerLoggedInEvent<'_>) {
    if let Some(player) = host.player(event.player) {
        let _ = player.tell(host, Text::literal(format!("Welcome, {}!", event.name)));
    }
}

// A player left, by any path. Server-side.
fn player_logged_out(&self, host: &mut dyn ServerHost, event: &mut PlayerLoggedOutEvent<'_>) {
    let _ = host.messages().broadcast(Text::literal(format!("{} left.", event.name)));
}
```

- `event.player` is the player's UUID. `host.player(...)` turns it into a handle, or `None` if they are gone.
- `player.tell` writes to one player. `host.messages().broadcast` writes to everyone and the server log.

**Try it:** build into your test instance and open a world: the welcome is in the chat.

**To remember things about the player** between joins, such as "first join", store it on them: see [Saving data](/docs/recipes-saved-data).

## Stop a block from being broken

**Status:** Works today.

**You get:** players cannot break your block `my_mod:ward_stone` unless they are in creative mode.

```rust
use std::sync::OnceLock;

#[derive(Default)]
struct Mod {
    ward_stone: OnceLock<BlockKey>, // filled once, in register
}

#[mod_api::horizon_mod]
impl Hooks for Mod {
    fn register(&self, r: &mut dyn Registrar, _: &RegistrationContext) {
        let _ = self.ward_stone.set(r.block_key("my_mod:ward_stone"));
    }

    // A player breaks a block. Server-side. Cancel to keep the block.
    fn break_block(&self, host: &mut dyn ServerHost, event: &mut BreakBlockEvent<'_>) -> Flow {
        if Some(&event.state.block()) != self.ward_stone.get() {
            return Flow::Continue;
        }
        // The player breaking it.
        let Some(player) = host.players().acting_player() else { return Flow::Continue };
        if player.is_creative(host) == Some(true) {
            return Flow::Continue;
        }
        let _ = player.action_bar(host, Text::literal("This stone is warded."));
        Flow::Cancel // nothing breaks, nothing drops
    }
}
```

- Look block ids up **once**, in `register`, and compare keys: a `BlockKey` comparison is cheap, a string is not.
- `event.exp_to_drop` changes the experience the block drops: `*event.exp_to_drop = Some(10);`.
- For harvest eligibility and experience, `BlockPart` has `can_harvest_block` and `exp_drop`; neither replaces this break veto. See [Blocks](/docs/recipes-blocks#a-block-that-does-something-when-right-clicked).

**Common mistake:** returning `Flow::Cancel` by accident for every block. Return `Flow::Continue` as soon as the block is not yours.

## Do something every second

**Status:** Works today.

**You get:** every 20 server ticks, a message in the server log and every player's chat. At the default tick rate, that is once a second.

```rust
use std::sync::atomic::{AtomicU32, Ordering};

#[derive(Default)]
struct Mod {
    ticks: AtomicU32,
}

#[mod_api::horizon_mod]
impl Hooks for Mod {
    // Twice per non-paused server tick: at its start and at its end.
    fn server_tick(&self, host: &mut dyn ServerHost, event: &mut ServerTickEvent<'_>) {
        if !matches!(event.phase, ServerTickPhase::ServerTickEnd { .. }) {
            return;
        }
        let ticks = self.ticks.fetch_add(1, Ordering::Relaxed) + 1;
        if ticks % 20 == 0 {
            let _ = host.messages().broadcast(Text::literal(format!("{} seconds", ticks / 20)));
        }
    }
}
```

- The hook takes `&self`, so a counter you change lives in an atomic or a `Mutex`.
- Keep tick hooks cheap: at the default tick rate, there are 20 ticks a second, or 40 calls with both phases. A paused server fires neither phase.
- `event.phase` also says whether the world is running: `ServerTickStart { world_running }` (and the end phase). A frozen world reports false except during a requested step.

**Other ticks:**

- **One level's tick:** `level_tick_post`.
- **A player's tick:** `player_tick_post`, with `event.player`.
- **A block's random tick**, as crops grow: the block's `BlockPart` answers `random_tick`, and its JSON sets `"random_ticks": true`. See [Making a content mod](/docs/modding/how-to/content-mods).
- **A block entity's tick:** [A block entity that ticks](/docs/recipes-block-entities#a-block-entity-that-ticks).

## Announce a mob's death

**Status:** Works today.

**You get:** a chat line for everyone when a zombie is about to die. Another listener can still cancel its death.

```rust
// A mob or player is about to die. Server-side.
fn living_death(&self, host: &mut dyn ServerHost, event: &mut LivingDeathEvent<'_>) -> Flow {
    if event.kind == "minecraft:zombie" {
        let line = format!("A zombie fell to {}", event.source.damage_type);
        let _ = host.messages().broadcast(Text::literal(line));
    }
    Flow::Continue
}
```

- `event.kind` is the entity type, such as `minecraft:zombie` or `my_mod:ghoul`.
- `event.source.damage_type` names the last blow, such as `minecraft:player_attack`.
- `event.source.causing` and `event.source.direct` identify the causing entity and the direct hit (such as a projectile); 0 means none or unknown. `event.weapon` carries the killing stack, if any.
- `Flow::Cancel` skips death and loot but does not heal. Heal the entity to keep it alive; at health at or below 0 its body is removed after 20 ticks.

**What it drops** is data: [Loot tables](/docs/recipes-loot). To change drops from code, use `living_drops`.

## Keep an entity out of the world

**Status:** Works today.

**You get:** phantoms are refused when they join a level, including when loaded from disk.

```rust
// An entity joins a level: spawned, summoned, dropped, or loaded with its chunk.
fn entity_join_level(&self, _: &mut dyn ServerHost, event: &mut EntityJoinLevelEvent<'_>) -> Flow {
    if event.kind == "minecraft:phantom" {
        return Flow::Cancel; // taken back out; a /summon of it fails
    }
    Flow::Continue
}
```

- It tells you about simulated entities, including items, orbs, arrows and boats, but not unsimulated displays, markers or interactions. Always check `event.kind`.
- `loaded_from_disk` is true when the entity comes back with its chunk.
- For spawning rules rather than a hard no, see [Controlling spawns](/docs/modding/how-to/world/spawning).

## A right click on any block

**Status:** Works today.

`right_click_block` hears every right click on every block, on the client and on the server, before the block's own use. For **your own** block, a `BlockPart` is simpler: [A block that does something when right-clicked](/docs/recipes-blocks#a-block-that-does-something-when-right-clicked). Use the global hook for rules across all blocks, such as keeping players out of a protected area: set `*event.cancellation_result = InteractionResult::Fail;` and return `Flow::Cancel`.

## Find the hook you need

There are hundreds of hooks and Part methods. To find one:

- **Search by the NeoForge or Fabric event you know:** hooks with counterparts name them in their documentation. See [Writing hooks](/docs/modding/start/writing-hooks) for listener rules.
- **Read every hook with its fields:** in a checkout of [Sunrise's repository](https://github.com/sunrise-org/sunrise), `cargo doc -p horizon-mod-api --open`, then open the `Hooks` trait.
- **Read how hooks fit together:** [Hooks and the Host](/docs/modding/concepts/hooks-and-the-host).
- **Nothing fits?** [Sunrise Gaps: events](/api-gaps#events) lists what is missing. [Injections](/docs/modding/concepts/injections) use `[[inject]]` listeners at published API points; they do not compile game code.
