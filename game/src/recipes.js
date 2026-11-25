// Every ingredient and dish in 烟火小馆. All art is drawn from these shapes
// and colours, so a dish is readable at a glance on the order board and in
// the wok. `chop` means the ingredient must go through the chopping board
// before it can be cooked; `station` is where its cooking step happens.

export const INGREDIENTS = {
  tomato: { id: 'tomato', name: '番茄', short: '茄', color: '#e8442e', dark: '#b32d1d', chop: true },
  egg: { id: 'egg', name: '鸡蛋', short: '蛋', color: '#ffd94d', dark: '#e0a92e', chop: false },
  pork: { id: 'pork', name: '猪肉', short: '肉', color: '#f2a0a8', dark: '#d97b84', chop: true },
  pepper: { id: 'pepper', name: '青椒', short: '椒', color: '#3fae5a', dark: '#2c7d40', chop: true },
  chicken: { id: 'chicken', name: '鸡肉', short: '鸡', color: '#f6c89f', dark: '#dd9a5b', chop: true },
  peanut: { id: 'peanut', name: '花生', short: '生', color: '#c98d4b', dark: '#9c6a32', chop: false },
  chili: { id: 'chili', name: '干辣椒', short: '辣', color: '#c22a1e', dark: '#8f1c12', chop: false },
  rice: { id: 'rice', name: '米饭', short: '饭', color: '#f7f3e6', dark: '#d9d2b8', chop: false },
  noodles: { id: 'noodles', name: '面条', short: '面', color: '#f2cd6b', dark: '#d9a93c', chop: false },
};

export const INGREDIENT_ORDER = [
  'tomato', 'egg', 'pork', 'pepper', 'chicken', 'peanut', 'chili', 'rice', 'noodles',
];

export const RECIPES = [
  {
    id: 'tomato-egg',
    name: '番茄炒蛋',
    price: 14,
    cookTime: 3.2,
    station: 'wok',
    needs: [
      { id: 'tomato', chop: true },
      { id: 'egg', chop: false },
    ],
    accent: '#e8442e',
  },
  {
    id: 'pepper-pork',
    name: '青椒肉丝',
    price: 18,
    cookTime: 3.6,
    station: 'wok',
    needs: [
      { id: 'pepper', chop: true },
      { id: 'pork', chop: true },
    ],
    accent: '#3fae5a',
  },
  {
    id: 'kung-pao',
    name: '宫保鸡丁',
    price: 22,
    cookTime: 4.0,
    station: 'wok',
    needs: [
      { id: 'chicken', chop: true },
      { id: 'peanut', chop: false },
      { id: 'chili', chop: false },
    ],
    accent: '#c22a1e',
  },
  {
    id: 'yangzhou-rice',
    name: '扬州炒饭',
    price: 16,
    cookTime: 3.4,
    station: 'wok',
    needs: [
      { id: 'rice', chop: false },
      { id: 'egg', chop: false },
    ],
    accent: '#f2cd6b',
  },
  {
    id: 'dandan-noodles',
    name: '担担面',
    price: 18,
    cookTime: 4.2,
    station: 'pot',
    needs: [
      { id: 'noodles', chop: false },
      { id: 'chili', chop: false },
    ],
    accent: '#d9a93c',
  },
];

/** Find a recipe by id. */
export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) ?? null;
}
