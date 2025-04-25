// Google Apps Script for Car & Bike Rental Web Application

// Global variables
const SPREADSHEET_ID = 'https://docs.google.com/spreadsheets/d/1ifoPMPfqTCEurS0EwLpgq2SYi_wIWk48fFf4TBEfeDA/edit?usp=sharing'; // Replace with your actual spreadsheet ID
const VEHICLES_SHEET_NAME = 'Vehicles';
const USERS_SHEET_NAME = 'Users';
const BOOKINGS_SHEET_NAME = 'Bookings';
const REVIEWS_SHEET_NAME = 'Reviews';

// Main function to handle HTTP requests
function doGet(e) {
  // Parse the request parameters
  const params = e.parameter;
  const action = params.action;
  
  // Route the request to the appropriate handler
  let result;
  try {
    switch (action) {
      case 'getVehicles':
        result = getVehicles();
        break;
      case 'getVehicleDetails':
        result = getVehicleDetails(params.id);
        break;
      case 'getVehiclesByType':
        result = getVehiclesByType(params.type);
        break;
      case 'searchVehicles':
        result = searchVehicles(params);
        break;
      case 'getReviews':
        result = getReviews(params.vehicleId);
        break;
      default:
        result = { error: 'Invalid action' };
    }
  } catch (error) {
    result = { error: error.toString() };
  }
  
  // Return the result as JSON
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Function to handle POST requests
function doPost(e) {
  // Parse the request parameters and payload
  const params = e.parameter;
  const action = params.action;
  let payload;
  
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid JSON payload' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Route the request to the appropriate handler
  let result;
  try {
    switch (action) {
      case 'login':
        result = login(payload);
        break;
      case 'register':
        result = register(payload);
        break;
      case 'createBooking':
        result = createBooking(payload);
        break;
      case 'addReview':
        result = addReview(payload);
        break;
      case 'contactForm':
        result = handleContactForm(payload);
        break;
      case 'newsletter':
        result = subscribeToNewsletter(payload);
        break;
      default:
        result = { error: 'Invalid action' };
    }
  } catch (error) {
    result = { error: error.toString() };
  }
  
  // Return the result as JSON
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Function to get all vehicles
function getVehicles() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(VEHICLES_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const vehicles = [];
  
  // Convert sheet data to JSON
  for (let i = 1; i < data.length; i++) {
    const vehicle = {};
    for (let j = 0; j < headers.length; j++) {
      vehicle[headers[j]] = data[i][j];
    }
    vehicles.push(vehicle);
  }
  
  return { vehicles };
}

// Function to get vehicle details by ID
function getVehicleDetails(id) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(VEHICLES_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find the vehicle with the matching ID
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === id.toString()) {
      const vehicle = {};
      for (let j = 0; j < headers.length; j++) {
        vehicle[headers[j]] = data[i][j];
      }
      
      // Get reviews for this vehicle
      vehicle.reviews = getReviews(id);
      
      return { vehicle };
    }
  }
  
  return { error: 'Vehicle not found' };
}

// Function to get vehicles by type (car or bike)
function getVehiclesByType(type) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(VEHICLES_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const vehicles = [];
  
  // Convert sheet data to JSON, filtering by type
  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('type')] === type) {
      const vehicle = {};
      for (let j = 0; j < headers.length; j++) {
        vehicle[headers[j]] = data[i][j];
      }
      vehicles.push(vehicle);
    }
  }
  
  return { vehicles };
}

// Function to search vehicles based on criteria
function searchVehicles(params) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(VEHICLES_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  let vehicles = [];
  
  // Convert sheet data to JSON
  for (let i = 1; i < data.length; i++) {
    const vehicle = {};
    for (let j = 0; j < headers.length; j++) {
      vehicle[headers[j]] = data[i][j];
    }
    vehicles.push(vehicle);
  }
  
  // Apply filters
  if (params.type && params.type !== 'all') {
    vehicles = vehicles.filter(v => v.type === params.type);
  }
  
  if (params.brand && params.brand !== 'all') {
    vehicles = vehicles.filter(v => v.brand === params.brand);
  }
  
  if (params.priceRange && params.priceRange !== 'all') {
    const [min, max] = params.priceRange.split('-');
    if (max) {
      vehicles = vehicles.filter(v => v.price >= parseFloat(min) && v.price <= parseFloat(max));
    } else {
      vehicles = vehicles.filter(v => v.price >= parseFloat(min));
    }
  }
  
  // Sort vehicles
  if (params.sortBy) {
    switch (params.sortBy) {
      case 'price-asc':
        vehicles.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        vehicles.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        vehicles.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        vehicles.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
  }
  
  return { vehicles };
}

// Function to get reviews for a vehicle
function getReviews(vehicleId) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(REVIEWS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const reviews = [];
  
  // Convert sheet data to JSON, filtering by vehicleId
  for (let i = 1; i < data.length; i++) {
    if (data[i][headers.indexOf('vehicleId')].toString() === vehicleId.toString()) {
      const review = {};
      for (let j = 0; j < headers.length; j++) {
        review[headers[j]] = data[i][j];
      }
      reviews.push(review);
    }
  }
  
  return reviews;
}

// Function to handle user login
function login(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(USERS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailIndex = headers.indexOf('email');
  const passwordIndex = headers.indexOf('password');
  
  // Find user with matching email and password
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailIndex] === payload.email) {
      // In a real application, you would use proper password hashing
      // This is a simplified example for demonstration purposes
      if (data[i][passwordIndex] === payload.password) {
        const user = {};
        for (let j = 0; j < headers.length; j++) {
          if (headers[j] !== 'password') { // Don't include password in response
            user[headers[j]] = data[i][j];
          }
        }
        return { success: true, user };
      } else {
        return { success: false, error: 'Invalid password' };
      }
    }
  }
  
  return { success: false, error: 'User not found' };
}

// Function to handle user registration
function register(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(USERS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailIndex = headers.indexOf('email');
  
  // Check if email already exists
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailIndex] === payload.email) {
      return { success: false, error: 'Email already registered' };
    }
  }
  
  // Create new user
  const newUser = [];
  for (let i = 0; i < headers.length; i++) {
    newUser.push(payload[headers[i]] || '');
  }
  
  // Add user to sheet
  sheet.appendRow(newUser);
  
  return { success: true, message: 'Registration successful' };
}

// Function to create a new booking
function createBooking(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(BOOKINGS_SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Create new booking
  const newBooking = [];
  for (let i = 0; i < headers.length; i++) {
    newBooking.push(payload[headers[i]] || '');
  }
  
  // Add booking ID
  const bookingId = Utilities.getUuid();
  newBooking[headers.indexOf('bookingId')] = bookingId;
  
  // Add timestamp
  newBooking[headers.indexOf('timestamp')] = new Date();
  
  // Add booking to sheet
  sheet.appendRow(newBooking);
  
  // Send confirmation email
  sendBookingConfirmation(payload);
  
  return { success: true, bookingId, message: 'Booking successful' };
}

// Function to add a review
function addReview(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(REVIEWS_SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Create new review
  const newReview = [];
  for (let i = 0; i < headers.length; i++) {
    newReview.push(payload[headers[i]] || '');
  }
  
  // Add review ID
  const reviewId = Utilities.getUuid();
  newReview[headers.indexOf('reviewId')] = reviewId;
  
  // Add timestamp
  newReview[headers.indexOf('timestamp')] = new Date();
  
  // Add review to sheet
  sheet.appendRow(newReview);
  
  return { success: true, reviewId, message: 'Review added successfully' };
}

// Function to handle contact form submissions
function handleContactForm(payload) {
  // Send email notification
  const subject = 'New Contact Form Submission: ' + payload.subject;
  const body = `
    Name: ${payload.name}
    Email: ${payload.email}
    Subject: ${payload.subject}
    Message: ${payload.message}
  `;
  
  MailApp.sendEmail({
    to: 'admin@riderent.com', // Replace with your email
    subject: subject,
    body: body
  });
  
  return { success: true, message: 'Message sent successfully' };
}

// Function to handle newsletter subscriptions
function subscribeToNewsletter(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Newsletter');
  const data = sheet.getDataRange().getValues();
  
  // Check if email already exists
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === payload.email) {
      return { success: false, error: 'Email already subscribed' };
    }
  }
  
  // Add email to sheet
  sheet.appendRow([payload.email, new Date()]);
  
  return { success: true, message: 'Subscription successful' };
}

// Function to send booking confirmation email
function sendBookingConfirmation(booking) {
  // Get vehicle details
  const vehicleDetails = getVehicleDetails(booking.vehicleId).vehicle;
  
  const subject = 'Booking Confirmation - RideRent';
  const body = `
    Dear ${booking.firstName} ${booking.lastName},
    
    Thank you for booking with RideRent. Your booking has been confirmed.
    
    Booking Details:
    - Booking ID: ${booking.bookingId}
    - Vehicle: ${vehicleDetails.name}
    - Pickup Date: ${booking.pickupDate}
    - Return Date: ${booking.returnDate}
    - Pickup Location: ${booking.pickupLocation}
    - Return Location: ${booking.returnLocation}
    - Total Cost: $${booking.totalCost}
    
    Please bring your driver's license and a valid credit card when picking up the vehicle.
    
    If you have any questions, please contact us at info@riderent.com or call us at +1 (123) 456-7890.
    
    Thank you for choosing RideRent!
    
    Best regards,
    The RideRent Team
  `;
  
  MailApp.sendEmail({
    to: booking.email,
    subject: subject,
    body: body
  });
}

// Function to check vehicle availability
function checkAvailability(vehicleId, startDate, endDate) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(BOOKINGS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const vehicleIdIndex = headers.indexOf('vehicleId');
  const pickupDateIndex = headers.indexOf('pickupDate');
  const returnDateIndex = headers.indexOf('returnDate');
  const statusIndex = headers.indexOf('status');
  
  // Convert dates to timestamps
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  // Check for overlapping bookings
  for (let i = 1; i < data.length; i++) {
    if (data[i][vehicleIdIndex].toString() === vehicleId.toString() && 
        data[i][statusIndex] !== 'cancelled') {
      const bookingStart = new Date(data[i][pickupDateIndex]).getTime();
      const bookingEnd = new Date(data[i][returnDateIndex]).getTime();
      
      // Check if dates overlap
      if ((start >= bookingStart && start <= bookingEnd) || 
          (end >= bookingStart && end <= bookingEnd) ||
          (start <= bookingStart && end >= bookingEnd)) {
        return false; // Vehicle is not available
      }
    }
  }
  
  return true; // Vehicle is available
}

// Function to get dashboard data for admin
function getDashboardData() {
  // Get total vehicles
  const vehiclesSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(VEHICLES_SHEET_NAME);
  const totalVehicles = vehiclesSheet.getLastRow() - 1;
  
  // Get total users
  const usersSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(USERS_SHEET_NAME);
  const totalUsers = usersSheet.getLastRow() - 1;
  
  // Get total bookings
  const bookingsSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(BOOKINGS_SHEET_NAME);
  const bookingsData = bookingsSheet.getDataRange().getValues();
  const totalBookings = bookingsSheet.getLastRow() - 1;
  
  // Calculate revenue
  let totalRevenue = 0;
  const headers = bookingsData[0];
  const totalCostIndex = headers.indexOf('totalCost');
  
  for (let i = 1; i < bookingsData.length; i++) {
    totalRevenue += parseFloat(bookingsData[i][totalCostIndex] || 0);
  }
  
  return {
    totalVehicles,
    totalUsers,
    totalBookings,
    totalRevenue
  };
}

// Function to add a new vehicle (admin only)
function addVehicle(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(VEHICLES_SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Create new vehicle
  const newVehicle = [];
  for (let i = 0; i < headers.length; i++) {
    newVehicle.push(payload[headers[i]] || '');
  }
  
  // Add vehicle ID
  const vehicleId = Utilities.getUuid();
  newVehicle[headers.indexOf('id')] = vehicleId;
  
  // Add vehicle to sheet
  sheet.appendRow(newVehicle);
  
  return { success: true, vehicleId, message: 'Vehicle added successfully' };
}

// Function to update a vehicle (admin only)
function updateVehicle(payload) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(VEHICLES_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  
  // Find vehicle with matching ID
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex].toString() === payload.id.toString()) {
      // Update vehicle data
      const rowData = [];
      for (let j = 0; j < headers.length; j++) {
        rowData.push(payload[headers[j]] !== undefined ? payload[headers[j]] : data[i][j]);
      }
      
      // Update the row
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([rowData]);
      
      return { success: true, message: 'Vehicle updated successfully' };
    }
  }
  
  return { success: false, error: 'Vehicle not found' };
}

// Function to delete a vehicle (admin only)
function deleteVehicle(id) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(VEHICLES_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  
  // Find vehicle with matching ID
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex].toString() === id.toString()) {
      // Delete the row
      sheet.deleteRow(i + 1);
      
      return { success: true, message: 'Vehicle deleted successfully' };
    }
  }
  
  return { success: false, error: 'Vehicle not found' };
}
