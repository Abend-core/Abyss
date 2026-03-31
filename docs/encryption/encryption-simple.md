# Chiffrement des données — Explication simple

## L'idée de base

Imagine que tu as une boîte à secrets avec un **cadenas très compliqué**.

Pour ouvrir cette boîte, tu dois avoir **3 choses à la fois** :
1. **Ton mot de passe** (que tu connais, personne d'autre)
2. **La clé secrète du serveur** (gardée secrète sur le serveur)
3. **Un petit code unique généré pour toi à l'inscription** (stocké en base de données)

Si quelqu'un vole **une seule** de ces trois choses → il **ne peut pas ouvrir la boîte**.

---

## Exemple simplifié

### Tu crées ton compte avec le mot de passe : `MonPassword123!`

À ce moment-là, le serveur fait 3 choses :

#### 1. Il crée un "hash" du mot de passe (empreinte digitale)
```
MonPassword123!  →  [fonction de hachage]  →  aB3xQ9zK2mL5pR8w
```
C'est comme une empreinte digitale : c'est impossible de revenir en arrière et obtenir le mot de passe original. Ça se stocke en base, comme ça à la prochaine connexion, tu tapes `MonPassword123!` et on compare si c'est la même empreinte.

#### 2. Il génère un petit code aléatoire pour TOI UNIQUEMENT
```
Code généré pour toi = "xY7aB2cD4eF6gH8i"
```
Ce code est stocké en base. Il est différent pour chaque utilisateur.

#### 3. Il crée la "vraie clé" qui va chiffrer tes données
```
Vraie clé = f(ton password, code généré pour toi, secret du serveur)
            = une combinaison des 3
```

Cette clé : **on ne la stocke JAMAIS nulle part**. Elle existera uniquement en mémoire pendant ta session.

---

## Quand tu veux chiffrer tes données

Tu stockes un secret, par exemple une clé API : `sk-proj-my-secret-api-key`

1. On prend la clé (que j'ai créé juste au-dessus)
2. On l'utilise pour **chiffrer** ton secret
3. On stocke le secret **chiffré** en base (personne ne peut le lire, c'est du charabia)

```
Avant chiffrement (lisible)   :  sk-proj-my-secret-api-key
Après chiffrement (charabia)  :  7hK9mP2xQ4vL8aB3dE6sT1cF5wR
```

---

## Quand tu te reconnectes

1. Tu tapes ton email et ton mot de passe
2. Le serveur **vérifie le mot de passe** (compare avec l'empreinte)
3. Ensuite, il **re-crée la clé de déchiffrement** exactement pareil qu'avant (en combinant ton password + le code unique + le secret serveur)
4. Il l'utilise pour **déchiffrer** tes données stockées

```
Données chiffrées (charabia)  :  7hK9mP2xQ4vL8aB3dE6sT1cF5wR
Clé re-créée                  :  (même qu'avant)
                                    ↓ déchiffrement
Résultat (lisible)            :  sk-proj-my-secret-api-key
```

---

## Pourquoi c'est sûr ?

### Si le pirate vole la base de données

Il a :
- ✅ L'empreinte du password
- ✅ Le code unique par utilisateur
- ✅ Les données chiffrées

Mais **il n'a pas le mot de passe réel**, donc **il ne peut rien déchiffrer**.

(L'empreinte est impossible à inverser, c'est comme essayer de reconstituer une personne à partir de son ADN — non, ça marche pas comme ça)

### Si le pirate vole le secret du serveur

Il a :
- ✅ Le secret du serveur
- ✅ Peut-être aussi la base (empreinte + codes uniques)

Mais **il n'a pas les mots de passe des utilisateurs**, donc **il ne peut rien déchiffrer**.

### Si le pirate écoute tes réseaux et capture ton password

Il a :
- ✅ Ton password en clair

Mais **il n'a pas le secret du serveur ni la base de données**, donc **il ne peut rien déchiffrer**.

---

## Le scénario vraiment dangereux

Le pirate aurait besoin de **TOUS LES TROIS à la fois** :
1. La base de données (codes + données chiffrées)
2. Le secret du serveur
3. Le password d'une personne

C'est très improbable. C'est pourquoi c'est sûr.

---

## Schéma mental simple

```
┌─────────────────────────────────────────┐
│        Ton secret à chiffrer            │
│   (ex: clé API = "sk-proj-abc123")      │
└────────────┬────────────────────────────┘
             │
             │  + Clé magique créée from:
             │    1. TON PASSWORD
             │    2. Code unique (en DB)
             │    3. Secret du serveur
             │
             ▼
    ┌─────────────────┐
    │  CHIFFREMENT    │ (=encryptage)
    └────────┬────────┘
             │
             ▼
    ┌──────────────────────────┐
    │  Bin-bin-bin (charabia)  │  ← stocké en DB
    │  7hK9mP2xQ4vL8aB3dE6s... │     (illisible)
    └──────────────────────────┘

À la reconnexion:
    ┌──────────────────────────┐
    │  7hK9mP2xQ4vL8aB3dE6s... │  ← récupéré de la DB
    └────────┬─────────────────┘
             │
             │  + Re-créer clé magique from:
             │    1. PASSWORD TAPPÉ
             │    2. Code unique (en DB)
             │    3. Secret du serveur
             │
             ▼
    ┌─────────────────┐
    │  DÉCHIFFREMENT  │ (=décryptage)
    └────────┬────────┘
             │
             ▼
    ┌──────────────────────────┐
    │  sk-proj-abc123          │  ← déchiffré, lisible!
    └──────────────────────────┘
```

---

## Les 3 ingrédients

| Ingrédient | Où il est ? | Qui le garde ? | Avec les 2 autres ? |
|---|---|---|---|
| **Password** | Ta tête | Toi seul | ❌ Niveau de sécurité: moyen |
| **Secret serveur** | Variable d'environnement | Admin serveur | ❌ Niveau de sécurité: moyen |
| **Code unique** | Base de données | Base de données | ❌ Niveau de sécurité: moyen |
| **Les 3 ensemble** | — | — | ✅ Niveau de sécurité: très élevé |

---

## C'est vraiment nécessaire ?

**Oui**, parce que :

- Si tu chiffrais **juste** avec le password → une personne qui connaît ton password (ami, ex, collègue) peut lire tes secrets
- Si tu chiffrais **juste** avec le secret serveur (la même clé pour tout le monde) → un pirate qui vole le serveur peut déchiffrer **TOUS les utilisateurs**
- Avec les **3**, même si une personne connaît une partie, elle ne peut rien faire

---

## En résumé

**Tu crées une boîte à secrets** avec ton password, le serveur ajoute son propre secret dessus, et la base de données ajoute un code unique.

**La boîte ne s'ouvre que si tu as les 3.**

C'est très difficile pour un pirate d'avoir simultanément ta tête, l'intérieur secret du serveur, ET la base de données.
