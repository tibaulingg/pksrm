# Configuration de la Courbe XP

Ce document explique comment ajuster la courbe de progression XP dans Mimizio.

## Fichier de Configuration

Le fichier `src/game/config/xpConfig.js` contient tous les paramètres de progression XP.

## Paramètres Configurables

### `initialXpToNextLevel`
- **Défaut:** `100`
- **Description:** Quantité d'XP requise pour passer du niveau 1 au niveau 2
- **Ajustement:** Augmente pour ralentir la progression, diminue pour l'accélérer

### `progressionCurve`
Options disponibles: `"linear"`, `"quadratic"`, `"exponential"`

#### Linear (par défaut)
- Croissance régulière et prévisible
- Chaque niveau est environ 10% plus difficile que le précédent
- Bon pour un jeu équilibré
- Exemple: 100 XP → 110 XP → 121 XP → 133 XP...

#### Quadratic
- Croissance plus agressive
- Les niveaux tard-jeu deviennent significativement plus durs
- Exemple avec multiplier 1.4: 100 → 140 → 196 → 275...

#### Exponential
- Croissance très agressive
- Recommandé seulement pour des fin de jeu très longues
- Les niveaux deviennent exponentiellement plus durs
- Exemple: 100 → 150 → 225 → 337...

### `xpMultiplier`
- **Défaut:** `1.1` (10% d'augmentation par niveau)
- **Plage recommandée:** `1.05` (5%) à `1.5` (50%)
- **Linear:** Augmente le pourcentage par niveau
- **Quadratic/Exponential:** Contrôle l'agressivité de la courbe

### `enemyXpMultiplier`
- **Défaut:** `1.0`
- **Description:** Multiplicateur global appliqué à TOUS les ennemis
- **Ajustement:** 
  - `1.5` = les ennemis donnent 50% plus d'XP
  - `0.5` = les ennemis donnent 50% moins d'XP

### `playerXpGainMultiplier`
- **Défaut:** `1.0`
- **Description:** Multiplicateur augmenté par les upgrades (ex: "Greedy")
- **Modification:** Automatique via les upgrades

## Exemples d'Ajustement

### Pour une progression plus rapide:
```javascript
initialXpToNextLevel: 80,      // Commence avec moins d'XP
xpMultiplier: 1.05,             // Seulement 5% d'augmentation par niveau
enemyXpMultiplier: 1.2,         // Les ennemis donnent 20% plus d'XP
```

### Pour une progression plus lente:
```javascript
initialXpToNextLevel: 120,
xpMultiplier: 1.15,             // 15% d'augmentation par niveau
enemyXpMultiplier: 0.8,         // Les ennemis donnent 20% moins d'XP
```

### Pour des niveaux tardifs ultra-difficiles:
```javascript
progressionCurve: "exponential",
xpMultiplier: 1.3,
initialXpToNextLevel: 100,
```

## Visualisation des Courbes

### Linear (1.1)
Niveau | XP Requis | XP Total
------|-----------|----------
1     | 100       | 0
2     | 110       | 100
3     | 121       | 210
4     | 133       | 331
5     | 146       | 464

### Linear (1.15)
Niveau | XP Requis | XP Total
------|-----------|----------
1     | 100       | 0
2     | 115       | 100
3     | 132       | 215
4     | 152       | 347
5     | 175       | 499

### Exponential (1.3)
Niveau | XP Requis | XP Total
------|-----------|----------
1     | 100       | 0
2     | 130       | 100
3     | 169       | 230
4     | 220       | 399
5     | 286       | 619

## Comment les Multiplicateurs Fonctionnent

1. **Orbe XP créé** = `baseXp` (de enemyConfig.js)
2. **Après multiplicateurs** = `baseXp * enemyXpMultiplier * playerXpGainMultiplier`
3. **Affichage à l'écran** = L'orbe mofire
4. **Au prochain niveau** = `calculateXpForLevel(niveau)` utilise `progressionCurve` et `xpMultiplier`

## Astuce: Tester la Progression

Pour tester rapidement différentes courbes:
1. Ouvre `src/game/config/xpConfig.js`
2. Change `xpMultiplier` ou `enemyXpMultiplier`
3. Recharge la page (hot reload)
4. Observe comment la barre XP se remplit plus vite/moins vite

Les changements s'appliquent immédiatement sans relancer le jeu.
