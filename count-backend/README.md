# SplitEasy API

Backend Spring Boot du projet **SplitEasy** : partage de dépenses entre amis (voyage, colocation,
événement), calcul des soldes et des remboursements suggérés.

## Stack

Java 21 · Spring Boot 3.3 · Spring Data JPA · Spring Security (JWT) · MySQL (XAMPP) · Flyway ·
MapStruct · Lombok · springdoc-openapi (Swagger) · JUnit 5 / Mockito / MockMvc.

## Prérequis

- **JDK 21**
- **Maven 3.9+** (ou le wrapper `mvnw` si vous en générez un ; ce projet n'en fournit pas —
  utilisez le Maven intégré de votre IDE — IntelliJ IDEA / VS Code + Extension Pack for Java —
  si `mvn` n'est pas sur votre PATH)
- **XAMPP** avec le module MySQL démarré (port 3306)

## 1. Préparer la base de données

1. Démarrez **MySQL** dans le panneau de contrôle XAMPP.
2. Ouvrez [phpMyAdmin](http://localhost/phpmyadmin) et créez une base vide :

   ```sql
   CREATE DATABASE spliteasy CHARACTER SET utf8mb4;
   ```

3. Rien d'autre à faire : Flyway crée automatiquement toutes les tables au premier démarrage
   de l'application (migration `V1__init_schema.sql`).

Par défaut, l'application se connecte avec l'utilisateur `root` sans mot de passe (config XAMPP
standard). Pour changer ces valeurs, utilisez des variables d'environnement (voir plus bas)
plutôt que de modifier `application.properties`.

## 2. Lancer l'application

```bash
cd count-backend
mvn spring-boot:run
```

L'API démarre sur **http://localhost:8080**.

### Variables d'environnement disponibles

| Variable                      | Défaut                        | Description                              |
|--------------------------------|-------------------------------|-------------------------------------------|
| `DB_HOST`                      | `localhost`                   | Hôte MySQL                                |
| `DB_PORT`                      | `3306`                        | Port MySQL                                |
| `DB_NAME`                      | `spliteasy`                   | Nom de la base                            |
| `DB_USERNAME`                  | `root`                        | Utilisateur MySQL                         |
| `DB_PASSWORD`                  | *(vide)*                      | Mot de passe MySQL                        |
| `APP_JWT_SECRET`                | clé de développement fournie   | Secret JWT, Base64, ≥ 256 bits            |
| `APP_JWT_EXPIRATION_MS`        | `86400000` (24h)              | Durée de validité du token                |
| `APP_CORS_ALLOWED_ORIGINS`     | `http://localhost:4200`       | Origine(s) autorisée(s) pour le frontend  |

⚠️ En production, définissez toujours `APP_JWT_SECRET` vous-même — ne gardez jamais la valeur
par défaut du dépôt.

## 3. Lancer les tests

Aucune base MySQL n'est nécessaire : les tests utilisent H2 en mémoire (mode compatibilité MySQL).

```bash
mvn test
```

## 4. Documentation API (Swagger)

Une fois l'application démarrée :

- Swagger UI : http://localhost:8080/swagger-ui.html
- Spécification OpenAPI (JSON) : http://localhost:8080/v3/api-docs

Toutes les routes sont protégées par JWT sauf `/api/auth/**` et la documentation elle-même.
Dans Swagger UI, cliquez sur **Authorize** et collez `Bearer <votre_token>`.

## 5. Exemples curl

### Inscription

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Alice","email":"alice@example.com","password":"password123"}'
```

### Connexion

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'
```

La réponse contient `token` : réutilisez-le dans l'en-tête `Authorization: Bearer <token>` pour
tous les appels suivants.

```bash
export TOKEN="<coller le token ici>"
```

### Créer un groupe

```bash
curl -X POST http://localhost:8080/api/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Voyage à Rome","description":"Été 2026","currency":"EUR"}'
```

La réponse contient `id` (groupId), `inviteCode` et `myParticipantId`.

### Ajouter un participant non inscrit

```bash
curl -X POST http://localhost:8080/api/groups/1/participants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Mamie"}'
```

### Créer une dépense (répartition égale)

```bash
curl -X POST http://localhost:8080/api/groups/1/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Restaurant",
    "amount": 100.00,
    "date": "2026-07-14",
    "category": "FOOD",
    "paidById": 1,
    "splitType": "EQUAL",
    "shares": [
      {"participantId": 1, "value": null},
      {"participantId": 2, "value": null}
    ]
  }'
```

### Consulter les soldes

```bash
curl http://localhost:8080/api/groups/1/balances -H "Authorization: Bearer $TOKEN"
```

### Remboursements suggérés

```bash
curl http://localhost:8080/api/groups/1/settlements -H "Authorization: Bearer $TOKEN"
```

### Enregistrer un remboursement

```bash
curl -X POST http://localhost:8080/api/groups/1/settlements \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fromParticipantId":2,"toParticipantId":1,"amount":50.00,"date":"2026-07-15"}'
```

### Rejoindre un groupe via un code d'invitation

```bash
# Aperçu (sans être membre)
curl http://localhost:8080/api/groups/invite/ABC1234XYZ -H "Authorization: Bearer $TOKEN"

# Rejoindre en créant un nouveau participant
curl -X POST http://localhost:8080/api/groups/join \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inviteCode":"ABC1234XYZ","newParticipantName":"Bob"}'
```

## Structure du projet

```
com.spliteasy
├── config/          SecurityConfig, CorsConfig, OpenApiConfig
├── security/        JWT (émission, filtre, entry point 401), SecurityUtils
├── entity/          Entités JPA + enums
├── repository/      Spring Data JPA + Specifications
├── dto/             request / response (records)
├── mapper/          MapStruct
├── service/          interfaces + impl (SplitCalculator, GroupAccessService,
│                     Auth/Group/Participant/Expense/Balance/Settlement/StatsService)
├── controller/      Contrôleurs REST
├── exception/       Exceptions métier + GlobalExceptionHandler
└── util/            MoneyUtils, InviteCodeGenerator
```
