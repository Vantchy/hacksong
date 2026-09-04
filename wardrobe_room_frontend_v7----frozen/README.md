# Wardrobe Room Frontend Demo v7

Open `index.html` in a browser.

v7 changes:
- Clothing grid is now 4 columns × 3 rows (12 slots).
- Category mapping:
  - 帽子 -> bucket hat image
  - 上衣 -> blue shirt image
  - 外套 -> cream cardigan image
  - 裤子 -> green pants image
- The category's clothing image appears in slot 1; the dashed + slot is slot 2.
- Clicking a clothing image previews it directly on the character.
- Clothing layers are positioned relative to the character stage for responsive sizing.
- Layer priority: pants < top < coat < hat.
- Selecting an item shows 返回 / 确认 buttons under the grid.
  - 确认 keeps the garment and returns to an unselected state.
  - 返回 restores the previously saved garment and returns to an unselected state.
- Selecting an item also shows a large 简介 panel to the right of the character, with a 修改 button.
- Wardrobe focus camera remains the same as v4/v6.
