const express = require('express');
const router = express.Router();

const { geocode } = require('../controllers/geocodeController');
const { route } = require('../controllers/routeController');
const { elevation } = require('../controllers/elevationController');
const { traffic } = require('../controllers/trafficController');
const { carbon } = require('../controllers/carbonController');
const { greenScore } = require('../controllers/greenScoreController');

router.get('/geocode', geocode);
router.get('/route', route);
router.get('/elevation', elevation);
router.get('/traffic', traffic);
router.get('/carbon', carbon);
router.get('/green-score', greenScore);

module.exports = router;
