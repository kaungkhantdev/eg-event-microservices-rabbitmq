const { createEvent, getEventById, updateEvent, deleteEvent, getAllEvents } = require('../repository/event.repository');
const { addEventToQueue, addEventToElasticsearchQueue } = require('./queue.service');
const { db } = require('../config/database');
const { publishEvent } = require('./rabbitmq.producer.service');

const createNewEventAndAddQueue = async (eventData) => {
  const trx = await db.transaction();

  try {
    const event = await createEvent(eventData, trx);
    console.log('Event created with ID:', event.id);

    // await Promise.all([
    //   addEventToQueue({
    //     operation: 'create',
    //     eventId: event.id,
    //     startDate: event.startDate,
    //     location: event.location,
    //     description: event.description,
    //     recipientEmail: 'apipostman20@gmail.com'
    //   }),
    //   addEventToElasticsearchQueue({
    //     operation: 'create',
    //     eventId: event.id,
    //     data: event
    //   })
    // ]);
    await publishEvent({
      operation: 'create',
      eventId: event.id,
      startDate: event.startDate,
      location: event.location,
      description: event.description,
      recipientEmail: 'apipostman20@gmail.com',
      data: event
    });

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

    await addEventToElasticsearchQueue({
      operation: 'update',
      eventId: event.id,
      data: event
    });

    return event;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

const removeEvent = async (id) => {
  try {
    await deleteEvent(id);

    await addEventToElasticsearchQueue({
      operation: 'delete',
      eventId: id
    });

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