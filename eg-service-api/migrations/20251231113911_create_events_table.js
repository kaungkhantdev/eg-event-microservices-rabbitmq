/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('events', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('location');
    table.timestamp('start_date').notNullable();
    table.timestamp('end_date').notNullable();
    table.string('category');
    table.string('organizer');
    table.integer('max_attendees');
    table.enum('status', ['draft', 'published', 'cancelled', 'completed']).notNullable().defaultTo('draft');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('events');
};
