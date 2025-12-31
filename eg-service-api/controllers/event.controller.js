const express = require('express');
const router = express.Router();
const { createNewEventAndAddQueue, getEvents } = require('../services/event.service');
const { validate, eventValidationSchema } = require('../middleware/validator');

const createEvent = async (req, res) => {
  try {
    const event = await createNewEventAndAddQueue(req.body);
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
}

const getAllEvents = async (req, res) => {
  try {
    const events = await getEvents();
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

router.post('/events', validate(eventValidationSchema.create), createEvent);
router.get('/events', getAllEvents);

const eventRoutes = router;

module.exports = eventRoutes;


