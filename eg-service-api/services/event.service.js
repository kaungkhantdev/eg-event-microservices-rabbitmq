const { createEvent, getEventById, updateEvent, deleteEvent, getAllEvents } = require('../repository/event.repository');
const { addEventToQueue, addEventToElasticsearchQueue } = require('./queue.service');
const { db } = require('../config/database');

const createNewEventAndAddQueue = async (eventData) => {
  const trx = await db.transaction();

  try {
    const event = await createEvent(eventData, trx);

    await addEventToQueue(event);
    await addEventToElasticsearchQueue(event);

    await trx.commit();
    return event;
  } catch (error) {
    await trx.rollback();
    console.error('Error creating event:', error);
    throw error;
  }
}

const getEvents = async () => {
  try {
    const events = await getAllEvents();
    return events;
  } catch (error) {
    console.error('Error fetching all events:', error);
    throw error;
  }
}

const getEvent = async (id) => {
  try {
    const event = await getEventById(id);
    return event;
  } catch (error) {
    console.error('Error fetching event by ID:', error);
    throw error;
  }
}

const updateExistingEvent = async (id, updateData) => {
  try {
    const event = await updateEvent(id, updateData);
    return event;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

const removeEvent = async (id) => {
  try {
    await deleteEvent(id);
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

module.exports = {
  getEvents,
  createNewEventAndAddQueue,
  getEvent,
  updateExistingEvent,
  removeEvent
}