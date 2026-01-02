const { db } = require("../config/database")

const createEvent = async (eventData, trx = null) => {
  try {
    const query = trx ? trx('events') : db('events');
    const [event] = await query.insert(eventData).returning('*');
    return event;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

const getEventById = async (id) => {
  try {
    const event = await db('events').where({ id }).first();
    return event;
  } catch (error) {
    console.error('Error fetching event by ID:', error);
    throw error;
  }
}

const updateEvent = async (id, updateData) => {
  try {
    const [event] = await db('events').where({ id }).update(updateData).returning('*');
    return event;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

const deleteEvent = async (id) => {
  try {
    await db('events').where({ id }).del();
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

const getAllEvents = async () => {
  try {
    const events = await db('events').select('*');
    return events;
  } catch (error) {
    console.error('Error fetching all events:', error);
    throw error;
  }
}

module.exports = {
  getAllEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent
}