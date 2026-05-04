# Migration Supabase -> Laravel 12 (MySQL)

Ce document reprend **debut a fin** les instructions de migration SQL vers Laravel 12/MySQL, en excluant:
- RLS (Row Level Security)
- policies
- triggers
- functions
- fichiers de diagnostic

## Regles de mapping de types (Supabase/PostgreSQL -> Laravel/MySQL)

- `UUID` -> `CHAR(36)` (`$table->uuid(...)`) ou `BINARY(16)` (optionnel)
- `TIMESTAMPTZ` -> `TIMESTAMP` (`$table->timestamp(...)`)
- `TEXT` -> `TEXT` (`$table->text(...)`)
- `JSONB` -> `JSON` (`$table->json(...)`)
- `BIGSERIAL` -> `BIGINT UNSIGNED AUTO_INCREMENT` (`$table->id()` ou `$table->unsignedBigInteger(...)->autoIncrement()`)
- `REFERENCES` -> FK Laravel (`$table->foreignUuid(...)->constrained(...)`)

> Note: la table `chat_conversations` n'apparait pas telle quelle dans les migrations SQL; la structure utilise `chat_rooms`.
> Ici, `chat_conversations` est mappee sur le schema `chat_rooms`.
>
> Note: la table `paroisses` n'a pas de `CREATE TABLE` explicite dans les migrations disponibles; le schema ci-dessous est une reconstruction pratique pour Laravel.

---

## 1) videos

### Commande
```bash
php artisan make:migration create_videos_table
```

### Migration
```php
Schema::create('videos', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->text('title');
    $table->text('description')->nullable();
    $table->text('video_url')->nullable();
    $table->text('thumbnail_url')->nullable();
    $table->integer('duration')->nullable();
    $table->integer('views')->default(0);
    $table->text('category')->nullable();
    $table->boolean('published')->default(true);
    $table->text('slug');
    $table->text('video_storage_path')->nullable();

    $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();

    $table->timestamp('created_at')->useCurrent();
    $table->index('created_at', 'idx_videos_created_at');
    $table->index('video_storage_path', 'idx_videos_storage_path');
});
```

---

## 2) profiles

### Commande
```bash
php artisan make:migration create_profiles_table
```

### Migration
```php
Schema::create('profiles', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->text('email');
    $table->text('full_name');
    $table->text('avatar_url')->nullable();
    $table->string('role')->default('member');
    $table->foreignUuid('invited_by')->nullable()->constrained('profiles')->nullOnDelete();
    $table->timestamp('last_seen_at')->nullable();
    $table->timestamp('created_at')->useCurrent();
    $table->timestamp('updated_at')->useCurrent();
});
```

---

## 3) paroisses

### Commande
```bash
php artisan make:migration create_paroisses_table
```

### Migration
```php
Schema::create('paroisses', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('nom');
    $table->string('slug')->unique();
    $table->text('description')->nullable();
    $table->text('logo_url')->nullable();
    $table->string('email')->nullable();
    $table->string('phone')->nullable();
    $table->text('address')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamp('created_at')->useCurrent();
    $table->timestamp('updated_at')->useCurrent();
});
```

---

## 4) events

### Commande
```bash
php artisan make:migration create_events_table
```

### Migration
```php
Schema::create('events', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->text('title');
    $table->text('description')->nullable();
    $table->text('location')->nullable();
    $table->text('image_url')->nullable();
    $table->timestamp('start_date');
    $table->timestamp('end_date')->nullable();
    $table->boolean('is_all_day')->default(false);
    $table->boolean('is_recurring')->default(false);
    $table->text('recurrence_rule')->nullable();
    $table->uuid('category_id')->nullable();
    $table->uuid('organizer_id')->nullable();
    $table->integer('max_participants')->nullable();
    $table->integer('current_participants')->default(0);
    $table->boolean('registration_required')->default(false);
    $table->timestamp('registration_deadline')->nullable();
    $table->string('status')->default('published');
    $table->text('slug')->nullable()->unique();
    $table->timestamp('created_at')->useCurrent();
    $table->timestamp('updated_at')->useCurrent();
});
```

---

## 5) donations

### Commande
```bash
php artisan make:migration create_donations_table
```

### Migration
```php
Schema::create('donations', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('user_id')->nullable()->constrained('profiles')->nullOnDelete();
    $table->boolean('is_anonymous')->default(false);
    $table->string('payer_name')->nullable();
    $table->string('payer_email')->nullable();
    $table->string('payer_phone', 30)->nullable();
    $table->text('intention_message')->nullable();
    $table->decimal('amount', 10, 2);
    $table->string('currency', 3)->default('XOF');
    $table->string('payment_method');
    $table->string('payment_status')->default('pending');
    $table->string('stripe_session_id')->nullable();
    $table->string('transaction_id')->nullable();
    $table->boolean('is_active')->default(true);
    $table->json('metadata')->nullable();
    $table->timestamp('created_at')->useCurrent();
    $table->timestamp('updated_at')->useCurrent();
});
```

---

## 6) live_streams

### Commande
```bash
php artisan make:migration create_live_streams_table
```

### Migration
```php
Schema::create('live_streams', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->text('title');
    $table->text('stream_url');
    $table->string('stream_type');
    $table->boolean('is_active')->default(false);
    $table->timestamp('created_at')->useCurrent();
    $table->timestamp('updated_at')->useCurrent();
});
```

---

## 7) gallery_images

### Commande
```bash
php artisan make:migration create_gallery_images_table
```

### Migration
```php
Schema::create('gallery_images', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->text('title');
    $table->text('description')->nullable();
    $table->text('image_url');
    $table->text('category')->nullable();
    $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
    $table->timestamp('created_at')->useCurrent();
});
```

---

## 8) homilies

### Commande
```bash
php artisan make:migration create_homilies_table
```

### Migration
```php
Schema::create('homilies', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->text('title');
    $table->text('priest_name');
    $table->text('description')->nullable();
    $table->date('homily_date');
    $table->text('video_url')->nullable();
    $table->text('image_url')->nullable();
    $table->text('transcript')->nullable();
    $table->integer('duration_minutes')->nullable();
    $table->uuid('category_id')->nullable();
    $table->text('category_label')->nullable();
    $table->uuid('officiant_id')->nullable();
    $table->text('video_storage_path')->nullable();
    $table->text('thumbnail_storage_path')->nullable();
    $table->timestamp('created_at')->useCurrent();
    $table->timestamp('updated_at')->useCurrent();

    $table->foreign('officiant_id')->references('id')->on('officiants')->nullOnDelete();
});
```

---

## 9) notifications

### Commande
```bash
php artisan make:migration create_notifications_table
```

### Migration
```php
Schema::create('notifications', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('user_id')->nullable()->constrained('profiles')->cascadeOnDelete();
    $table->text('title');
    $table->text('body')->nullable();
    $table->boolean('is_read')->default(false);
    $table->json('metadata')->nullable();
    $table->timestamp('created_at')->useCurrent();

    $table->index(['user_id', 'is_read'], 'idx_notifications_user_is_read');
});
```

---

## 10) officiants

### Commande
```bash
php artisan make:migration create_officiants_table
```

### Migration
```php
Schema::create('officiants', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('full_name', 100);
    $table->string('title', 50)->nullable();
    $table->string('grade', 50)->nullable();
    $table->string('phone', 50)->nullable();
    $table->string('email', 100)->nullable();
    $table->text('photo_url')->nullable();
    $table->json('roles')->nullable();
    $table->json('responsibilities')->nullable();
    $table->json('competencies')->nullable();
    $table->uuid('supervisor_id')->nullable();
    $table->integer('display_order')->default(0);
    $table->boolean('is_active')->default(true);
    $table->json('available_days')->nullable();
    $table->json('available_hours')->nullable();
    $table->text('bio')->nullable();
    $table->text('description')->nullable();
    $table->json('specialties')->nullable();
    $table->foreignUuid('paroisse_id')->nullable()->constrained('paroisses')->cascadeOnDelete();
    $table->timestamp('created_at')->useCurrent();
    $table->timestamp('updated_at')->useCurrent();
});
```

---

## 11) directory

### Commande
```bash
php artisan make:migration create_directory_table
```

### Migration
```php
Schema::create('directory', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name', 100);
    $table->text('description')->nullable();
    $table->string('category', 50);
    $table->string('email', 100)->nullable();
    $table->string('phone', 30)->nullable();
    $table->string('website', 255)->nullable();
    $table->text('image_url')->nullable();
    $table->boolean('is_active')->default(true);
    $table->integer('display_order')->default(0);
    $table->foreignUuid('updated_by')->nullable()->constrained('profiles')->nullOnDelete();
    $table->timestamp('created_at')->useCurrent();
    $table->timestamp('updated_at')->useCurrent();
});
```

---

## 12) religious_feasts

### Commande
```bash
php artisan make:migration create_religious_feasts_table
```

### Migration
```php
Schema::create('religious_feasts', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name', 255);
    $table->text('description')->nullable();
    $table->date('date');
    $table->string('feast_type', 20)->default('fixed');
    $table->string('liturgy_color', 7)->default('#8B0000');
    $table->text('gospel_reference')->nullable();
    $table->uuid('homily_id')->nullable();
    $table->text('prayer_text')->nullable();
    $table->text('reflection_text')->nullable();
    $table->text('image_url')->nullable();
    $table->boolean('is_active')->default(true);
    $table->timestamp('created_at')->useCurrent();
    $table->timestamp('updated_at')->useCurrent();
});
```

---

## 13) roles

### Commande
```bash
php artisan make:migration create_roles_table
```

### Migration
```php
Schema::create('roles', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name')->unique();
    $table->text('description')->nullable();
    $table->timestamp('created_at')->useCurrent();
});
```

---

## 14) user_roles

### Commande
```bash
php artisan make:migration create_user_roles_table
```

### Migration
```php
Schema::create('user_roles', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
    $table->string('role')->default('member');
    $table->foreignUuid('granted_by')->nullable()->constrained('profiles')->nullOnDelete();
    $table->timestamp('granted_at')->useCurrent();

    $table->unique(['user_id', 'role']);
});
```

---

## 15) chat_conversations (mappe depuis chat_rooms)

### Commande
```bash
php artisan make:migration create_chat_conversations_table
```

### Migration
```php
Schema::create('chat_conversations', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->text('name');
    $table->text('description')->nullable();
    $table->string('type')->default('group');
    $table->boolean('is_private')->default(false);
    $table->foreignUuid('created_by')->nullable()->constrained('profiles')->nullOnDelete();
    $table->integer('member_count')->default(0);
    $table->timestamp('last_message_at')->nullable();
    $table->timestamp('created_at')->useCurrent();
});
```

---

## 16) chat_messages

### Commande
```bash
php artisan make:migration create_chat_messages_table
```

### Migration
```php
Schema::create('chat_messages', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('conversation_id')->constrained('chat_conversations')->cascadeOnDelete();
    $table->foreignUuid('sender_id')->nullable()->constrained('profiles')->nullOnDelete();
    $table->text('content');
    $table->string('type')->default('text');
    $table->text('attachment_url')->nullable();
    $table->boolean('is_edited')->default(false);
    $table->boolean('is_deleted')->default(false);
    $table->uuid('reply_to_id')->nullable();
    $table->timestamp('created_at')->useCurrent();
    $table->timestamp('updated_at')->useCurrent();

    $table->foreign('reply_to_id')->references('id')->on('chat_messages')->nullOnDelete();
});
```

---

## 17) backups

### Commande
```bash
php artisan make:migration create_backups_table
```

### Migration
```php
Schema::create('backups', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->text('name')->nullable();
    $table->text('description')->nullable();
    $table->json('data');
    $table->unsignedBigInteger('size')->nullable();
    $table->foreignUuid('created_by')->nullable()->constrained('profiles')->nullOnDelete();
    $table->timestamp('created_at')->useCurrent();
});
```

---

## Ordre recommande de creation des migrations

1. `profiles`
2. `paroisses`
3. `roles`
4. `user_roles`
5. `officiants`
6. `videos`
7. `events`
8. `donations`
9. `live_streams`
10. `gallery_images`
11. `homilies`
12. `notifications`
13. `directory`
14. `religious_feasts`
15. `chat_conversations`
16. `chat_messages`
17. `backups`

Si tu veux, je peux ensuite te generer les **fichiers PHP Laravel complets prets a coller** (`up()` + `down()`) un par un, dans cet ordre.
