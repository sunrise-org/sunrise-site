# Recipes: tags

Copy-paste tags: put your blocks and items in vanilla's tags, make tags of your own, share convention `c:` tags with other mods, and check a tag from code. Replace `my_mod` with your mod id.

A **tag** is a named list of blocks, items, fluids or biomes. Vanilla uses them everywhere: which pickaxe mines what, what counts as a log, which biomes a village spawns in. Tags are **vanilla 26.3 data pack files**, inside your mod's folder and its one `.hmod`.

> [!NOTE] Checked against `de8b4e2`
> Checked against the mod API at [arismoko/horizon `de8b4e2`](https://github.com/arismoko/horizon/tree/de8b4e2526df9d7f611515b78123a26a3914176f), which Sunrise merges. Rust snippets were compile-checked against `horizon-mod-api`; they were not tried in game.

## Where tag files go

- **Your own tags:** `data/my_mod/tags/<kind>/<name>.json` is the tag `my_mod:<name>`.
- **Vanilla's tags:** `data/minecraft/tags/<kind>/...`. Under `minecraft`, a mod may add tags and `assets/minecraft/atlases/` files, but no other content.
- **Convention tags**, shared by NeoForge and Fabric mods: `data/c/tags/<kind>/...`.
- Examples of `<kind>` are `block`, `item`, `fluid`, `entity_type` and `worldgen/biome`, as in vanilla.

## Add your block to a vanilla tag

**Status:** Works today.

**You get:** `my_mod:ruby_block` added to vanilla's `mineable/pickaxe` and `needs_iron_tool` tags. Tags alone do not define the block's loot table or its `requires_tool` property.

**File:** `data/minecraft/tags/block/mineable/pickaxe.json`

```json
{ "values": ["my_mod:ruby_block"] }
```

**File:** `data/minecraft/tags/block/needs_iron_tool.json`

```json
{ "values": ["my_mod:ruby_block"] }
```

Your file **adds** to vanilla's tag and to other mods' files for it. It doesn't replace them.

**Try it:** `cargo horizon-mod build`, start the game, mine the block with a stone and an iron pickaxe.

**Common mistakes:**

- `tags/blocks/` (old name). Since 1.21 the folder is `tags/block/`, and `tags/item/`.
- An id written with `#` in `values` names a tag, not a block: `"#minecraft:logs"` puts every log in.

Other useful vanilla tags: `minecraft:logs` and `minecraft:planks` for blocks, `minecraft:pickaxes` and `minecraft:swords` for tools, `minecraft:fences` and `minecraft:walls` for blocks that connect ([A pipe or cable](/docs/recipes-blocks#a-pipe-or-cable-that-connects)).

## A tag of your own

**Status:** Works today.

**You get:** `my_mod:ruby_tools`, an item tag your recipes and code can use.

**File:** `data/my_mod/tags/item/ruby_tools.json`

```json
{ "values": ["my_mod:ruby_pickaxe", "my_mod:ruby_sword", "#minecraft:pickaxes"] }
```

- An entry starting with `#` pulls in a whole tag.
- Use it in a recipe ingredient as `"#my_mod:ruby_tools"`: see [Any item in a tag](/docs/recipes-crafting#any-item-in-a-tag).

## A convention tag shared with other mods

**Status:** Works today.

**You get:** your ruby counts as a ruby for every mod that asks for `c:gems/ruby`, and the other way round.

**File:** `data/c/tags/item/gems/ruby.json`

```json
{ "values": ["my_mod:ruby"] }
```

**File:** `data/c/tags/item/gems.json`

```json
{ "values": ["my_mod:ruby"] }
```

- Use the names NeoForge and Fabric mods use, such as `c:gems/...`, `c:ingots/...`, `c:ores/...`. Matching names is the whole point.
- An entry naming an id nobody registers (another mod that isn't installed) is dropped on its own. The rest of the tag still loads, where vanilla would drop the whole tag.

## Replace a tag instead of adding to it

**Status:** Works today. Use with care.

**You get:** a tag that holds only what your file lists.

**File:** `data/minecraft/tags/block/needs_diamond_tool.json`

```json
{ "replace": true, "values": ["minecraft:obsidian", "my_mod:ruby_block"] }
```

> [!WARNING] The result depends on load order
> `"replace": true` drops vanilla's entries and those of every mod loaded before yours. Mods loaded after you still add theirs. The game writes a line in the log naming your mod and the file.

Details: [Namespaces and limits](/docs/modding/how-to/content-mods#namespaces-and-limits).

## A tag entry only when another mod is on

**Status:** Works today.

**You get:** a tag file that loads only when the mod `other_mod` is on.

**File:** `data/c/tags/item/gems/ruby.json`

```json
{
  "neoforge:conditions": [{ "type": "neoforge:mod_loaded", "modid": "other_mod" }],
  "values": ["other_mod:red_crystal"]
}
```

A file left out this way leaves the tag's other entries alone. Details: [Conditional data](/docs/modding/how-to/items/conditional-data).

## Check a tag from code

**Status:** Works today, with Rust code.

**You get:** a block that answers a right click with any item in `c:gems`.

**File:** `src/lib.rs`

```rust
use mod_api::*;

#[derive(Default)]
struct Mod;

struct GemSocket;

#[mod_api::horizon_part]
impl BlockPart for GemSocket {
    // Right click with an item in hand. Runs on the server.
    fn use_item_on(
        &self,
        host: &mut dyn ServerHost,
        event: &mut UseItemOnEvent<'_>,
    ) -> Option<InteractionResult> {
        let stack = event.click.stack?;
        let tags = host.tags();
        // Resolve the tag's name to a key. Keep the key if you check often.
        let gems = tags.key(&Identifier::parse("c:gems").ok()?)?;
        // None: tags or item mappings unavailable. Some(false): not in the tag.
        if tags.is_in_tag(stack.item(), gems) != Some(true) {
            return None;
        }
        let player = host.player(event.click.player)?;
        let _ = player.tell(host, Text::literal("That's a gem!"));
        Some(InteractionResult::Success)
    }
}

#[mod_api::horizon_mod]
impl Hooks for Mod {
    fn register(&self, r: &mut dyn Registrar, _: &RegistrationContext) {
        let socket = r.block_key("my_mod:gem_socket");
        r.block_part(socket, GemSocket);
    }
}
```

The same `tags` service lists a tag's members in vanilla's order: `tags.items(key)`, `tags.blocks(key)` and `tags.fluids(key)`.

For blocks and fluids there are shorter calls on `host`:

- `host.block_in_tag(block, "minecraft:logs")` takes a `BlockKey`.
- `host.fluid_in_tag("minecraft:water", "minecraft:water")` takes a fluid's name.

Both answer `None` when the world's tags or the required mappings are unavailable. On a client they read the tags the server sent.

**Try it:** build the code into a test instance (`horizon-launcher native-build . --instance Development --trust-native-code`), then right-click the block holding a ruby and holding dirt.

**Common mistakes:**

- Treating `None` as "not in the tag". `None` means the game can't answer yet.
- Writing the tag with `#` in `Identifier::parse`: the name is `c:gems`, without `#`.

## A biome's tag

**Status:** Works today, with Rust code.

`level.biome_in_tag(host, "minecraft:plains", "minecraft:is_forest")` says whether a biome is in a biome tag, without loading chunks. A biome tag of your own is a file in `data/my_mod/tags/worldgen/biome/`. Details: [Check biome tags](/docs/modding/how-to/world/check-biome-tags).

## Inside a loot function

**Status:** Works today, with Rust code.

The server-side `loot_function` and `loot_condition` hooks get the tags as `event.tags`, the same read-only service as `host.tags()`, but no Host. Add this method to your `#[mod_api::horizon_mod] impl Hooks`:

```rust
fn loot_condition(&self, event: &mut LootConditionEvent<'_>) {
    if event.kind != "my_mod:gem_tool" {
        return;
    }
    let Some(gems) = Identifier::parse("c:gems").ok().and_then(|id| event.tags.key(&id)) else {
        return;
    };
    // Holds when the tool that broke the block is in `c:gems`.
    event.holds = event
        .ctx
        .tool
        .as_ref()
        .is_some_and(|tool| event.tags.is_in_tag(tool.item, gems) == Some(true));
}
```

The loot hooks themselves: [Loot tables](/docs/recipes-loot#a-loot-condition-of-your-own). Details: [Reading tags in custom loot](/docs/modding/how-to/items/loot-tags).

## What isn't here yet

- **Listing every tag.** **Not yet:** there is no call for it. **Workaround:** ask about the tags you know by name.
- **A mod's own `placed_feature` tags in a biome modifier.** **Not yet:** `#tag` in a modifier's `features` reads vanilla's tags only. **Workaround:** list the features by id.
- More gaps by area: [Sunrise Gaps](/api-gaps).
