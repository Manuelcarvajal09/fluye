import { pgTable, text, integer, timestamp, jsonb, primaryKey, index, uniqueIndex, real, date, bigserial, smallint, boolean } from "drizzle-orm/pg-core";

/** Perfil y preferencias. user_id = id de Clerk. */
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  name: text("name").notNull().default(""),
  level: text("level").notNull().default("A2"),
  goalMinutes: smallint("goal_minutes").notNull().default(10),
  dailyNew: smallint("daily_new").notNull().default(8),
  topics: jsonb("topics").$type<string[]>().notNull().default([]),
  tz: text("tz").notNull().default("America/Mexico_City"),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  lastGoalDay: date("last_goal_day"),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  /** Moneda cosmética (nunca afecta FSRS ni bloquea aprendizaje). */
  gems: integer("gems").notNull().default(0),
  /** Protectores de racha disponibles (máx. 2). */
  freezes: smallint("freezes").notNull().default(0),
  /** Monedas del armario (prendas, accesorios, mascotas, cofres y potenciadores). Saldo inicial 120. */
  coins: integer("coins").notNull().default(120),
  /** Vidas: se pierden con errores en lecciones (nunca bloquean el estudio) y se recuperan practicando. */
  lives: smallint("lives").notNull().default(5),
  /** Último día local en que se entregó la vida extra diaria. */
  livesDay: date("lives_day"),
  /** Protección activada con gemas: el próximo error no quita vida. */
  shield: smallint("shield").notNull().default(0),
  /** Potenciadores de doble XP guardados y hasta cuándo dura el activo. */
  boosts: smallint("boosts").notNull().default(0),
  boostUntil: timestamp("boost_until", { withTimezone: true }),
  /** Código para que otra persona te agregue (no expone correo ni id). */
  friendCode: text("friend_code").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Movimientos de monedas, gemas, vidas y potenciadores con clave idempotente: cada premio o cargo ocurre una sola vez. */
export const walletEvents = pgTable(
  "wallet_events",
  {
    userId: text("user_id").notNull(),
    key: text("key").notNull(),
    currency: text("currency").notNull(), // coins | gems | lives | shield | boosts
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.key] }), index("wallet_user_time_idx").on(t.userId, t.createdAt)],
);

/** Amistades: un par por fila con user_a < user_b. Pendiente hasta que la otra persona acepta. */
export const friendships = pgTable(
  "friendships",
  {
    userA: text("user_a").notNull(),
    userB: text("user_b").notNull(),
    status: text("status").notNull().default("pending"), // pending | accepted
    requestedBy: text("requested_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userA, t.userB] }), index("friendships_b_idx").on(t.userB)],
);

/** Regalos entre amistades. `client_key` evita duplicar un envío repetido; `opened_at` hace que se cobre una sola vez. */
export const gifts = pgTable(
  "gifts",
  {
    id: text("id").primaryKey(),
    fromUser: text("from_user").notNull(),
    toUser: text("to_user").notNull(),
    kind: text("kind").notNull(), // letter | gems | boost
    amount: integer("amount").notNull().default(0),
    message: text("message").notNull().default(""),
    clientKey: text("client_key").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    thanks: text("thanks"),
    thankedAt: timestamp("thanked_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("gifts_client_idx").on(t.fromUser, t.clientKey), index("gifts_to_idx").on(t.toUser, t.sentAt), index("gifts_from_idx").on(t.fromUser, t.sentAt)],
);

/**
 * Una tarjeta FSRS por (persona, ítem, modalidad).
 * `fsrs` guarda la tarjeta completa de ts-fsrs; `due`, `state` y `stability` se copian para poder consultar.
 */
export const cards = pgTable(
  "cards",
  {
    userId: text("user_id").notNull(),
    itemId: text("item_id").notNull(),
    mode: text("mode").notNull(), // recog | prod | listen | speak
    due: timestamp("due", { withTimezone: true }).notNull(),
    state: smallint("state").notNull().default(0), // 0 new, 1 learning, 2 review, 3 relearning
    stability: real("stability").notNull().default(0),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    fsrs: jsonb("fsrs").$type<Record<string, unknown>>().notNull(),
    suspended: smallint("suspended").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastReview: timestamp("last_review", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.itemId, t.mode] }), index("cards_due_idx").on(t.userId, t.due)],
);

/** Historial de repasos (permite recalcular, exportar y optimizar FSRS en el futuro). */
export const reviewLogs = pgTable(
  "review_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id").notNull(),
    itemId: text("item_id").notNull(),
    mode: text("mode").notNull(),
    rating: smallint("rating").notNull(), // 1 again, 2 hard, 3 good, 4 easy
    stateBefore: smallint("state_before").notNull(),
    stabilityAfter: real("stability_after").notNull(),
    scheduledDays: real("scheduled_days").notNull(),
    durationMs: integer("duration_ms"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow(),
    /** Id generado por el cliente: reintentos y recargas no duplican el repaso. */
    attemptId: text("attempt_id"),
    /** Primer intento sin ayudas (único elegible para medir retención). */
    firstTry: boolean("first_try"),
    hints: smallint("hints").notNull().default(0),
    revealed: boolean("revealed").notNull().default(false),
    /** graded (calificado por la app) | self (autoevaluado) */
    kind: text("kind").notNull().default("graded"),
  },
  (t) => [index("logs_user_time_idx").on(t.userId, t.reviewedAt), uniqueIndex("logs_attempt_idx").on(t.userId, t.attemptId)],
);

/** Resumen diario (racha, XP, misiones). `day` es la fecha local de la persona. */
export const dailyStats = pgTable(
  "daily_stats",
  {
    userId: text("user_id").notNull(),
    day: date("day").notNull(),
    xp: integer("xp").notNull().default(0),
    reviews: integer("reviews").notNull().default(0),
    correct: integer("correct").notNull().default(0),
    newItems: integer("new_items").notNull().default(0),
    speaking: integer("speaking").notNull().default(0),
    seconds: integer("seconds").notNull().default(0),
    missions: jsonb("missions").$type<string[]>().notNull().default([]),
    /** 1 = día cubierto por un protector de racha (no es un día estudiado). */
    frozen: smallint("frozen").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: text("user_id").notNull(),
    lessonId: text("lesson_id").notNull(),
    score: real("score").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

/** Práctica de sonidos: percepción (pares mínimos, medible) y producción (autoevaluada). */
export const soundProgress = pgTable(
  "sound_progress",
  {
    userId: text("user_id").notNull(),
    soundId: text("sound_id").notNull(),
    perceptionTotal: integer("perception_total").notNull().default(0),
    perceptionCorrect: integer("perception_correct").notNull().default(0),
    recordings: integer("recordings").notNull().default(0),
    selfScoreSum: integer("self_score_sum").notNull().default(0),
    lastAt: timestamp("last_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.soundId] })],
);

/**
 * Miembros invitados. El acceso a la app exige una fila activa (o ser propietario por variable de entorno).
 * Revocar una invitación (status revoked) y desactivar a un miembro (disabled) son cosas distintas.
 */
export const members = pgTable("members", {
  email: text("email").primaryKey(), // en minúsculas
  userId: text("user_id").unique(),
  role: text("role").notNull().default("member"), // member | owner
  status: text("status").notNull().default("invited"), // invited | active | disabled | revoked | expired
  invitationId: text("invitation_id"),
  sends: smallint("sends").notNull().default(0),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  invitedAt: timestamp("invited_at", { withTimezone: true }).notNull().defaultNow(),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  disabledAt: timestamp("disabled_at", { withTimezone: true }),
});

/** Errores útiles por categoría (para micro-práctica y cierre de sesión). Privados de cada persona. */
export const errorEvents = pgTable(
  "error_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id").notNull(),
    attemptId: text("attempt_id").notNull(),
    itemId: text("item_id"),
    mode: text("mode"),
    category: text("category").notNull(), // tense | article | preposition | word_order | false_friend | comprehension | sound | vocab | spelling
    expected: text("expected"),
    given: text("given"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("errors_attempt_idx").on(t.userId, t.attemptId, t.category), index("errors_user_time_idx").on(t.userId, t.createdAt)],
);

/** Tiempo activo agregado: un contador acumulado por (persona, día, dispositivo); se guarda el máximo, así reintentar no suma doble. */
export const activeTime = pgTable(
  "active_time",
  {
    userId: text("user_id").notNull(),
    day: date("day").notNull(),
    clientId: text("client_id").notNull(),
    seconds: integer("seconds").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day, t.clientId] })],
);

/** Sesiones de estudio (para reanudar, contar sesiones y medir constancia). */
export const studySessions = pgTable(
  "study_sessions",
  {
    userId: text("user_id").notNull(),
    id: text("id").notNull(),
    kind: text("kind").notNull().default("daily"), // daily | mission | return | review | free
    missionId: text("mission_id"),
    minutes: smallint("minutes").notNull().default(10),
    steps: smallint("steps").notNull().default(0),
    done: smallint("done").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.id] }), index("sessions_user_time_idx").on(t.userId, t.startedAt)],
);

/** Libro de gemas con clave idempotente (p. ej. "goal:2026-11-23"): un mismo premio nunca se otorga dos veces. */
export const gemLedger = pgTable(
  "gem_ledger",
  {
    userId: text("user_id").notNull(),
    key: text("key").notNull(),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.key] })],
);

/** Objetos cosméticos comprados. */
export const inventory = pgTable(
  "inventory",
  {
    userId: text("user_id").notNull(),
    itemId: text("item_id").notNull(),
    acquiredAt: timestamp("acquired_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.itemId] })],
);

/** Consultas de ayuda durante la escucha (texto, subtítulos, traducción): se registran para medir comprensión real. */
export const listenEvents = pgTable(
  "listen_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id").notNull(),
    lessonId: text("lesson_id").notNull(),
    kind: text("kind").notNull(), // transcript | subtitles | translation | line
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("listen_user_time_idx").on(t.userId, t.createdAt)],
);

/**
 * Colecciones personales: agrupaciones de entradas canónicas (ítems curados o del catálogo).
 * No copian tarjetas: una entrada puede estar en varias colecciones y su progreso FSRS es uno solo.
 */
export const collections = pgTable(
  "collections",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    color: text("color").notNull().default("esmeralda"),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("collections_user_idx").on(t.userId, t.updatedAt)],
);

export const collectionItems = pgTable(
  "collection_items",
  {
    collectionId: text("collection_id").notNull(),
    userId: text("user_id").notNull(),
    itemId: text("item_id").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.itemId] }), index("collection_items_user_idx").on(t.userId, t.itemId)],
);
