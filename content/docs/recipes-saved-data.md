# Recipes: saved data

Keep your own values on players, entities, block entities, chunks and whole levels, saved with the world. Sunrise calls these **attachments**, as NeoForge does. Java modders may know them as data attachments or persistent data.

Every recipe here needs the Rust part of a mod: start with `cargo horizon-mod new my_mod --template native`, or add code to a mod you have ([Add code to your mod](/docs/mod-code)). Nothing here needs a data file: the values live in the world's save.

> [!NOTE]
> Checked against the mod API at [arismoko/horizon `de8b4e2`](https://github.com/arismoko/horizon/tree/de8b4e2526df9d7f611515b78123a26a3914176f), which Sunrise merges. The login-count and mana HUD examples were compile-checked against `horizon-mod-api`, as were the level, chunk and entity fragments with supporting declarations and function wrappers. The examples were not run in game.

## How an attachment works

1. **Declare it once**, as a `static AttachmentType<T>`: its id, its default, and how to save it.
2. **Read and write it** in a server hook with a mutable host and a `Holder` (who carries it). The holder must be loaded.
3. The game **saves it** with that holder, and loads it back with it.

The holders:

- `Holder::Player(uuid)`: a player.
- `Holder::Entity(id)`: any other entity (mobs, items, minecarts...). `id` is `entity.id()`.
- `Holder::BlockEntity([x, y, z])`: a block entity.
- `Holder::Chunk([x, z])`: a chunk, by chunk coordinates.
- `Holder::Level`: the whole dimension the hook runs in.

## A number on each player, saved

**Status:** Works today.

**You get:** every player's login count, saved with the world and kept when they die.

**File:** `src/lib.rs`

```rust
use mod_api::*;

// Declared once. The (namespace, name) pair is its id: keep it stable.
static LOGINS: AttachmentType<i32> = AttachmentType {
    namespace: "my_mod",
    name: "logins",
    default: || 0, // what `get` returns, and stores, when absent
    // How to save it: to and from a compound. Without a codec, it is not saved.
    codec: Some(AttachmentCodec {
        encode: |n| Ok([("count".into(), Tag::Int(*n))].into()),
        decode: |saved| match saved.get(&"count".into()) {
            Some(Tag::Int(n)) => Ok(*n),
            _ => Err(AttachmentError::Decode),
        },
    }),
    copy_on_death: true, // keep it when the player respawns (needs a codec)
    sync: false,         // don't send it to clients
};

#[derive(Default)]
struct Mod;

#[mod_api::horizon_mod]
impl Hooks for Mod {
    fn player_logged_in(&self, host: &mut dyn ServerHost, event: &mut PlayerLoggedInEvent<'_>) {
        let holder = Holder::Player(event.player);
        let count = LOGINS.get(host, holder).unwrap_or(0) + 1;
        if LOGINS.set(host, holder, count).is_ok() {
            if let Some(player) = host.player(event.player) {
                let _ = player.tell(host, Text::literal(format!("Login number {count}")));
            }
        }
    }
}
```

The methods, on `LOGINS`:

- `get(host, holder)`: the value. Stores the default when absent.
- `get_existing(host, holder)`: `Some(value)` or `None`. Never inserts a default.
- `has(host, holder)`: whether a value is there.
- `set(host, holder, value)` and `remove(host, holder)`.

Each returns a `Result`: an `AttachmentError` says why, such as `MissingHolder` for a player who isn't there.

**Try it:** build into your test instance, join, leave, join again: the number goes up. Restart the game: it keeps counting.

**Common mistakes:**

- Changing `namespace` or `name` after release: old saves keep the old entry and your mod reads the default.
- A `decode` that doesn't match `encode`: the saved value reads as an error, not as the default.
- `copy_on_death: true` without a codec: `get` and `set` fail with `InvalidCopyPolicy`.

## A value on the player that the HUD shows

**Status:** Works today, for players on Sunrise clients that negotiate attachment sync.

**You get:** a `mana` value the server owns. The game sends it to the player's client by itself, and a HUD bar draws it.

```rust
use mod_api::*;

static MANA: AttachmentType<i32> = AttachmentType {
    namespace: "my_mod",
    name: "mana",
    default: || 100,
    codec: Some(AttachmentCodec {
        encode: |n| Ok([("mana".into(), Tag::Int(*n))].into()),
        decode: |saved| match saved.get(&"mana".into()) {
            Some(Tag::Int(n)) => Ok(*n),
            _ => Err(AttachmentError::Decode),
        },
    }),
    copy_on_death: false,
    sync: true, // send it to the clients that see this player (needs a codec)
};

const LAYER: &str = "my_mod:mana_bar";

#[derive(Default)]
struct Mod;

#[mod_api::horizon_mod]
impl Hooks for Mod {
    // Server: spend 10 mana on each login, as a stand-in for a spell.
    fn player_logged_in(&self, host: &mut dyn ServerHost, event: &mut PlayerLoggedInEvent<'_>) {
        let holder = Holder::Player(event.player);
        let mana = MANA.get(host, holder).unwrap_or(100);
        let _ = MANA.set(host, holder, (mana - 10).max(0)); // sent to the client at the tick's end
    }

    // Client: the HUD layer, as in the menus recipes.
    fn register_gui_layers(&self, _: &RegistrationContext, event: &mut RegisterGuiLayersEvent<'_>) {
        event.layers.push(GuiLayer {
            id: LAYER.into(),
            placement: GuiLayerPlacement::Above("minecraft:hotbar".into()),
        });
    }

    // Client: read the copy the server synced, and draw it.
    fn gui_layer_draw(&self, host: &dyn ClientHost, event: &mut GuiLayerDrawEvent<'_>) {
        if event.layer != LAYER {
            return;
        }
        let Some(me) = host.local_player() else { return };
        let mana = host
            .query(&MANA)
            .ok()
            .and_then(|snapshot| snapshot.get(AttachmentHolder::Player(me)).ok().flatten())
            .unwrap_or(0); // nothing synced yet
        let [width, height] = event.draw.size();
        let (x, y) = (width / 2.0 - 40.0, height - 52.0);
        event.draw.fill([x, y, 80.0, 5.0], 0xFF202040);
        event.draw.fill([x, y, 80.0 * mana as f32 / 100.0, 5.0], 0xFF4060FF);
    }
}
```

- The server sends the value when `get` creates it, on every `set` and `remove`, and when a client starts seeing the holder. Changes in one tick go once, at its end.
- A player's value goes to that player and to the players tracking them.
- On the client, `set` and `remove` change only the client's copy. Change values on the server.
- To send again by hand: `MANA.sync_data(host, holder)`.

**Try it:** join the world: the bar shows 90. Join again: 80.

**Common mistakes:**

- `sync: true` without a codec: refused with `InvalidSyncPolicy`. The codec's compound is what crosses the network.
- Reading with `MANA.get` on the client in a draw hook: it needs `&mut`. Use the `query` snapshot, as above.
- A namespace or name over 256 UTF-16 code units is not sent. Messages must fit the connection's frame limits; there is no separate 1 MiB attachment cap. Unencodable values are not sent.

More HUD drawing: [A HUD element of your own](/docs/recipes-menus#a-hud-element-of-your-own).

## Data for the whole world

**Status:** Works today.

**You get:** a counter shared by everyone in a dimension, such as "bosses defeated".

```rust
static BOSSES: AttachmentType<i32> = AttachmentType {
    namespace: "my_mod",
    name: "bosses_defeated",
    default: || 0,
    codec: Some(AttachmentCodec {
        encode: |n| Ok([("n".into(), Tag::Int(*n))].into()),
        decode: |saved| match saved.get(&"n".into()) {
            Some(Tag::Int(n)) => Ok(*n),
            _ => Err(AttachmentError::Decode),
        },
    }),
    copy_on_death: false,
    sync: false,
};

// In a server hook with a mutable host:
let total = BOSSES.get(host, Holder::Level).unwrap_or(0) + 1;
let _ = BOSSES.set(host, Holder::Level, total);
```

- `Holder::Level` is the dimension the hook runs in. The Overworld and the Nether each have their own.
- It is saved in that dimension's `data/horizon/attachments.dat`, not in `level.dat`.
- For one value for the whole save, always write it from the Overworld.

## Data on a chunk or a mob

**Status:** Works today.

The same `AttachmentType`, another holder:

```rust
// In a server hook, with `pos` a block position and `entity` an `EntityRef`.
// A chunk, by chunk coordinates: block x and z divided by 16, rounded down.
let chunk = Holder::Chunk([pos[0].div_euclid(16), pos[2].div_euclid(16)]);
let pollution = POLLUTION.get(host, chunk).unwrap_or(0);
let _ = POLLUTION.set(host, chunk, pollution + 1);

// Any entity except players: by its id.
let _ = KILLS.set(host, Holder::Entity(entity.id()), 1);
```

`POLLUTION` and `KILLS` are `AttachmentType<i32>` statics declared as [above](#a-number-on-each-player-saved). A value saved on an entity stays with it through saves, by its UUID.

## Data on a block entity

**Status:** Works today.

A block entity already has a saved compound: read it with `entity.data(host)` and change it with `entity.merge_data(host, compound)`, or edit `event.entity.nbt` in its `block_entity_tick` Part (leave `event.reply` as `BlockEntityTickReply::Changed` to keep the edits). See [A block that remembers a number](/docs/recipes-block-entities#a-block-that-remembers-a-number). An attachment on `Holder::BlockEntity([x, y, z])` works too, and is the way to add data to **another mod's or vanilla's** block entity.

## A value that isn't saved

**Status:** Works today.

Set `codec: None`. The value lives while the holder is loaded and is gone on unload or restart. Use it for caches and cooldowns. It can't be synced or copied on death, since both need a codec.

## Vanilla NBT on an entity

**Status:** Partly. Merging works on mobs, dropped items, armor stands and item frames; never on players, as in vanilla.

`entity.nbt(host)` reads an entity's data as `/data get` does, and `entity.merge_nbt(host, compound)` changes it as `/data merge entity` does. Use it to change vanilla fields (`NoAI`, `Silent`...). For your own values, use an attachment: it works on every holder, players included.

## Find every holder that has a value

**Status:** Works today, for loaded holders in the current dimension.

`host.query(&MANA)` returns a snapshot of every loaded holder that has a value. On the server, `host.query_mut(&MANA)` gives rows you can `set` or `remove`. See [Query attachment holders](/docs/modding/concepts/attachments/querying).

## Limits and conversion

- **NeoForge's extras:** a default that depends on the holder, a custom copy handler, saving only sometimes, sending to only some players, and partial sync updates. **Workaround:** decide in your code before calling `set`; attachments do not offer custom recipient filtering.
- **Copying on mob conversion** is automatic for entries with a codec, regardless of `copy_on_death`. Unsaved entries stay on the removed mob. `living_conversion_post` sees the copy; a cancelled `living_conversion_pre` copies nothing.
- **Data on an item stack** is not an attachment: use the stack's components.
- More gaps: [Sunrise Gaps: saved data](/api-gaps#saved-data) and [data attachments](/api-gaps#data-attachments).

## Go deeper

- The full contract: [Attachments](/docs/modding/concepts/attachments).
- Queries, snapshots and their costs: [Query attachment holders](/docs/modding/concepts/attachments/querying).
- Network NBT bytes: [Maths and network NBT](/docs/modding/reference/maths-and-network-nbt).
