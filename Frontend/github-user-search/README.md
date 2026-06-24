# Github user search

Mini application React / TypeScript créée avec Vite.

Elle permet de rechercher des utilisateurs Github directement pendant la saisie, sans bouton de validation. Les résultats sont affichés sous forme de cartes. Un mode édition permet ensuite de sélectionner des cartes pour les dupliquer ou les supprimer côté front.

## Fonctionnalités

- Recherche d’utilisateurs via l’API Github
- Recherche automatique pendant la saisie
- Debounce pour limiter les appels API
- Annulation des anciennes requêtes quand la recherche change vite
- Gestion du chargement
- Gestion du cas sans résultat
- Gestion simple de la rate limit Github
- Affichage responsive des cartes
- Mode édition
- Sélection simple ou totale des cartes
- Duplication des cartes sélectionnées
- Suppression des cartes sélectionnées

## Installation

```bash
npm install
