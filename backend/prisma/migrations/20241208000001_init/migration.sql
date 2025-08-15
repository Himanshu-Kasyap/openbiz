-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "form_data" JSONB NOT NULL,
    "validation_status" TEXT NOT NULL DEFAULT 'pending',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_schemas" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "schema_data" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_schemas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_session_id_key" ON "users"("session_id");

-- CreateIndex
CREATE INDEX "idx_user_step" ON "form_submissions"("user_id", "step_number");

-- CreateIndex
CREATE INDEX "idx_submission_date" ON "form_submissions"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "form_schemas_version_key" ON "form_schemas"("version");

-- CreateIndex
CREATE INDEX "idx_active_schema" ON "form_schemas"("is_active");

-- CreateIndex
CREATE INDEX "idx_schema_version" ON "form_schemas"("version");

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;