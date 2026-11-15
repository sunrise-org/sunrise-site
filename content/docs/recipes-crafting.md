# Recipes: crafting and smelting

Copy-paste recipes for the crafting table, the furnaces, the stonecutter and the smithing table. Replace `my_mod` with your mod id. The examples assume your mod already defines the ruby items and blocks they use.

Recipes are **vanilla 26.3 data pack files**. Each one is a file in `data/my_mod/recipe/`, inside your mod's folder and its one `.hmod`, alongside `horizon-mod.toml`. The file's path gives the recipe's id: `data/my_mod/recipe/ruby_block.json` is `my_mod:ruby_block`.

> [!NOTE] Checked against the mod API
> This page was checked against the mod API at [arismoko/horizon `de8b4e2`](https://github.com/arismoko/horizon/tree/de8b4e2526df9d7f611515b78123a26a3914176f), which Sunrise merges. The Rust ingredient-hook example was compile-checked against `horizon-mod-api`; the recipes were not tried in game.

## How recipe files work

- An **ingredient** is an item id (`"minecraft:diamond"`), a tag with `#` (`"#c:gems/ruby"`), or a list of ids (`["minecraft:coal", "minecraft:charcoal"]`).
- A **result** is an object: `{ "id": "my_mod:ruby", "count": 9 }`. Leave out `count` for one.
- Sunrise reads recipes when loading data, and reads world data packs again on `/reload`. After changing a file in your mod, rebuild the `.hmod` and restart the game.

## A shaped recipe

**Status:** Works today.

**You get:** nine rubies in a 3 × 3 square make one block of ruby.

**File:** `data/my_mod/recipe/ruby_block.json`

```json
{
  "type": "minecraft:crafting_shaped",
  "category": "building",
  "pattern": ["###", "###", "###"],
  "key": { "#": "my_mod:ruby" },
  "result": { "id": "my_mod:ruby_block" }
}
```

- `pattern` is up to 3 rows of up to 3 characters. A space is an empty slot.
- `key` says which ingredient each character stands for.
- `category` is the recipe book tab: `building`, `redstone`, `equipment` or `misc`.

**Try it:** `cargo horizon-mod build`, start the game with the mod, then `/give @s my_mod:ruby 9` and use a crafting table.

**Common mistakes:**

- A character in `pattern` that is missing from `key`: the recipe doesn't load. Read the log while you work.
- An unknown result item: define your ruby block before using it in a recipe. Use the object form shown above for the result.

## A shapeless recipe

**Status:** Works today.

**You get:** a block of ruby back into nine rubies, in any slot.

**File:** `data/my_mod/recipe/ruby_from_ruby_block.json`

```json
{
  "type": "minecraft:crafting_shapeless",
  "category": "misc",
  "ingredients": ["my_mod:ruby_block"],
  "result": { "id": "my_mod:ruby", "count": 9 }
}
```

`ingredients` lists one entry per item. Two of the same item is the id written twice.

## Furnace, blast furnace, smoker and campfire

**Status:** Works today.

**You get:** raw ruby smelts into a ruby in a furnace, and twice as fast in a blast furnace.

**File:** `data/my_mod/recipe/ruby_from_smelting.json`

```json
{
  "type": "minecraft:smelting",
  "category": "misc",
  "ingredient": "my_mod:raw_ruby",
  "result": { "id": "my_mod:ruby" },
  "experience": 0.7,
  "cookingtime": 200
}
```

**File:** `data/my_mod/recipe/ruby_from_blasting.json`

```json
{
  "type": "minecraft:blasting",
  "category": "misc",
  "ingredient": "my_mod:raw_ruby",
  "result": { "id": "my_mod:ruby" },
  "experience": 0.7,
  "cookingtime": 100
}
```

- The four types: `minecraft:smelting` (furnace), `minecraft:blasting`, `minecraft:smoking` (food) and `minecraft:campfire_cooking`.
- `cookingtime` is in ticks: 20 is one second.
- `experience` sets furnace-family XP per recipe use; campfire cooking does not award it.

> [!WARNING] Always write `cookingtime`
> Without it, Sunrise uses 200 for every type, a blast furnace too. Set 100 explicitly for the faster blasting and smoking recipes.

## A stonecutter recipe

**Status:** Works today.

**You get:** one block of ruby cut into four ruby tiles.

**File:** `data/my_mod/recipe/ruby_tiles_from_stonecutting.json`

```json
{
  "type": "minecraft:stonecutting",
  "ingredient": "my_mod:ruby_block",
  "result": { "id": "my_mod:ruby_tiles", "count": 4 }
}
```

## A smithing upgrade

**Status:** Works today.

**You get:** a ruby sword, a netherite upgrade template and a netherite ingot make a netherite ruby sword.

**File:** `data/my_mod/recipe/netherite_ruby_sword.json`

```json
{
  "type": "minecraft:smithing_transform",
  "template": "minecraft:netherite_upgrade_smithing_template",
  "base": "my_mod:ruby_sword",
  "addition": "minecraft:netherite_ingot",
  "result": { "id": "my_mod:netherite_ruby_sword" }
}
```

Leave out `template` or `addition` and that slot must stay empty.

## Any item in a tag

**Status:** Works today.

**You get:** a recipe that takes any ruby, yours or another mod's, through the convention tag `c:gems/ruby`.

**File:** `data/c/tags/item/gems/ruby.json` (puts your ruby in the tag)

```json
{ "values": ["my_mod:ruby"] }
```

**File:** `data/my_mod/recipe/ruby_lamp.json`

```json
{
  "type": "minecraft:crafting_shaped",
  "category": "redstone",
  "pattern": [" R ", "RGR", " R "],
  "key": { "R": "#c:gems/ruby", "G": "minecraft:glowstone" },
  "result": { "id": "my_mod:ruby_lamp" }
}
```

More on tags: [Tags](/docs/recipes-tags).

## A recipe only when another mod is on

**Status:** Works today.

**You get:** a recipe that loads only when `other_mod` is in the enabled server-mod set for this load. Without it, the file is left out.

**File:** `data/my_mod/recipe/ruby_from_other_mod.json`

```json
{
  "neoforge:conditions": [{ "type": "neoforge:mod_loaded", "modid": "other_mod" }],
  "type": "minecraft:crafting_shapeless",
  "category": "misc",
  "ingredients": ["other_mod:red_crystal"],
  "result": { "id": "my_mod:ruby" }
}
```

- Every condition in the list must hold.
- Other forms include `neoforge:true`, `neoforge:false`, `neoforge:not` (with `value`), `neoforge:and` and `neoforge:or` (with `values`).
- An unknown condition in a namespace owned by a registered condition handler refuses reload. A foreign unknown condition leaves the file out and logs an error.

Details: [Conditional data](/docs/modding/how-to/items/conditional-data).

## Remove or change a vanilla recipe

**Status:** Works today.

**You get:** recipes whose ids match `minecraft:*_planks` removed, and every `my_mod` recipe that asked for an iron ingot accepts any iron ingot from the convention tag.

**File:** `data/my_mod/recipe_filter/tweaks.json`

```json
{
  "filters": [
    { "id": "minecraft:*_planks", "remove": true },
    { "id": "my_mod:*", "replace_input": { "from": "minecraft:iron_ingot", "to": "#c:ingots/iron" } }
  ]
}
```

- Match keys: `id`, `type`, `input` and `output`. `*` matches any run of characters.
- Each filter has exactly one action: `remove`, `replace_input` or `replace_output`.
- Filters see the final set of recipes, after every pack, and reach every recipe type.

**Common mistake:** a filter with a typo in a key, or with two actions, is skipped with a warning in the log. It never matches every recipe by accident.

Details: [Recipe filters](/docs/modding/how-to/items/recipe-filters).

## An ingredient kind of your own

**Status:** Works today, with Rust code.

**You get:** an ingredient `my_mod:undamaged_pickaxe` that takes an iron or diamond pickaxe, but only one that isn't worn.

**File:** `data/my_mod/recipe/ruby_pickaxe_upgrade.json`

```json
{
  "type": "minecraft:crafting_shapeless",
  "category": "equipment",
  "ingredients": [{ "type": "my_mod:undamaged_pickaxe" }, "my_mod:ruby"],
  "result": { "id": "my_mod:ruby_pickaxe" }
}
```

**File:** `src/lib.rs`

```rust
use mod_api::*;

#[derive(Default)]
struct Mod;

#[mod_api::horizon_mod]
impl Hooks for Mod {
    // At load: candidate items for this custom ingredient.
    // Built-in kinds are handled by the loader; check our kind first.
    fn ingredient(&self, _: &dyn DataLoadContext, event: &mut IngredientEvent<'_>) {
        if event.kind == "my_mod:undamaged_pickaxe" {
            event.items.push("minecraft:iron_pickaxe".into());
            event.items.push("minecraft:diamond_pickaxe".into());
        }
    }

    // At craft time: refuse a stack the list allowed. `accept` starts true.
    fn ingredient_test(&self, _: &dyn LoopContext, event: &mut IngredientTestEvent<'_>) {
        if event.kind == "my_mod:undamaged_pickaxe" && event.stack.is_damaged() {
            event.accept = false;
        }
    }
}
```

- The ingredient object reaches both hooks as `event.data`, an API NBT compound. Neither hook takes a `Host`: they use the owning load or matching loop context, on either side.
- Give the same answer for the same input: `ingredient` runs once per occurrence per load, including `/reload`; `ingredient_test` can run many times during matching.

**Try it:** build the code into a test instance (`horizon-launcher native-build . --instance Development --trust-native-code`), then try a new and a worn pickaxe in the grid.

**Common mistakes:**

- Not checking `event.kind`: your hook then answers every mod's kinds.
- With no `ingredient` listener, a custom kind makes the recipe fail to load. If a listener leaves its candidate list empty, the recipe remains available for manual matching but cannot be placed through the recipe book. Supply every candidate item; a nonempty list rejects other items before `ingredient_test` runs.

Details: [A mod's own ingredient kinds](/docs/modding/how-to/items/ingredient-kinds) and [matching at craft time](/docs/modding/how-to/items/ingredient-matching).

## What isn't here yet

- **Ingredient kinds beyond the built-ins.** Sunrise reads `neoforge:compound`, `neoforge:intersection`, `neoforge:difference`, `neoforge:components`, `neoforge:block_tag` and `neoforge:custom_display`. For another kind, supply your own hooks as above. See [Built-in item ingredients](/docs/modding/how-to/native-mods/builtin-item-ingredients).
- **A recipe type of your own** with its own station. **Partly:** register a recipe type and a raw serializer first; an unregistered serializer refuses the recipe load. The registered raw recipes keep their JSON, but your station owns matching and its menu. Read them with `Host::recipes_of_type` and cache definitions after publication: [Recipe serializers and recipe types](/docs/modding/crafting-recipe-kinds), [Cache recipe definitions](/docs/modding/how-to/items/reload-stable-recipes) and [Reading recipe rules](/docs/modding/how-to/items/recipe-rules).
- More gaps by area: [Sunrise Gaps](/api-gaps).
