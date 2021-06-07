const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const home = require('../controllers/home');

router.get('/', home.homePage);
router.get('/securityProblems', securityController.getSecurityProblems);
router.get('/securityProblemDetails', securityController.getDetailedSecurityProblems);

module.exports = router;