const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const path = require("path");
const { Console } = require('console');
const { Knex } = require('knex');
app.use(express.static(path.join(__dirname, 'public')));
const knex = require('knex')({
  client: 'oracledb',
  connection: {
    user: 'abhinash',
    password: 'abhinash',
    connectString: 'localhost/XE'
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});


//loguot 
app.get('/logout', (req, res) => {
  // Clear the cookie by setting its value to an empty string and setting the expiration date to a past date
  res.clearCookie('token', { path: '/' });
  // Redirect the user to the login page or any other desired page
  res.redirect('/login');
});

const IsAuth = async(req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
      return res.redirect('/login');
  }
  
  try {
    const decoded = jwt.verify(token, 'HOUSING SOCIETY');
    const USER_ID = decoded; 
    let USER = (await knex('RESIDENTT')).find(U => U.USER_ID == USER_ID.USER);
    req.user = decoded;
    console.log(USER.ROLE)
    if(USER.ROLE == "Resident")
    {
      next();
    }
    else{
    res.redirect('/login')
    }
} catch (error) {
      res.status(400).json({ error: 'Invalid token' });
  }
};
const adminIsAuth = async(req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
      return res.redirect('/login');
  }
  try {
      const decoded = jwt.verify(token, 'HOUSING SOCIETY');
      const USER_ID = decoded; 
      let USER = (await knex('RESIDENTT')).find(U => U.USER_ID == USER_ID.USER);
      req.user = decoded;
      console.log(USER.ROLE)
      if(USER.ROLE == "admin")
      {
        next();
      }
      else{
      res.redirect('/login')
      }
  } catch (error) {
      res.status(400).json({ error: 'Invalid token' });
  }
};




app.get('/api/users', async (_req, res) => {
  try {
    const users = await knex('USERS').select('*');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get("/", (_req, res) => {
  res.render("Dashboard")
})



app.get("/welfarecommittee", (_req, res) => {
  res.render("welfarecommittee")
})
// welfare committe
app.post('/committee', async (req, res) => {
  try {
    console.log(req.body);
    const { WELFARE_ID, TITLE,  START_DATE, END_DATE } = req.body;

// Assuming START_DATE and END_DATE are arrays, access the individual values
const startDate = START_DATE[0];
const endDate = END_DATE[0];

// Then, insert the single values into the database
await knex('WELFARECOMMITTEE').insert({
  WELFAREID: WELFARE_ID[0],
  NAME: TITLE,
  STARTDATE: START_DATE,
  ENDDATE: START_DATE
});

    res.status(200).send(' WELFARE COMMITTEE ADDED SUCCESSFUL'); // Send response after successful insertion
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error'); // Send error response
  }
});
app.post('/insert', async (req, res) => {
  Console.log("chlo");
  console.log(req.body);
});

app.get("/admindashboard", adminIsAuth, (_req, res) => {
  res.render("admindashboard")
})

app.get('/viewss', async (req, res) => {
  try {
    // Fetch welfare committee data from the database
    const welfareData = await knex('WELFARECOMMITTEE').select('*');
    // Render the adminDashboard.ejs file and pass the welfareData to it
    res.render('viewwelfare', { id: welfareData });
  } catch (error) {
    console.error('Error fetching welfare data:', error);
    // Handle the error appropriately
    res.status(500).send('Internal Server Error');
  }
});
// Updated app.get('/residents') route
app.get('/viewresident', async (req, res) => {
  try {
    // Fetch resident data from the RESIDENTT table
    const residents = await knex('RESIDENTT').select('*');
    // Render the residents.ejs view and pass the resident data to it
    res.render('viewresident', { residents }); // Updated to match the view file name
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching resident data');
  }
});

// Route for updating a resident
app.get("/editresident/:id", async (req, res) => {
  let residentId = req.params.id;
  try {
    const resident = await knex('RESIDENTT').where('USER_ID', residentId).first();
    if (!resident) {
        return res.status(404).send('Resident not found');
    }
    res.render('editresidentt', { resident });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching resident data for update");
  }
});

app.post('/editresident', async (req, res) => {
  const residentId = req.body.userId; // Retrieve USER_ID from the form data
  const { name, email, phone, gender, flat, role } = req.body;

  try {
    // Update the resident information in the database
    await knex('RESIDENTT')
      .where('USER_ID', residentId) // Use USER_ID to identify the resident to update
      .update({
        NAME: name,
        EMAIL_ID: email,
        PHONE: phone,
        GENDER: gender,
        FLAT: flat,
        ROLE: role
      });
    // Redirect to the viewresident route after successful update
    res.redirect("/viewresident");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating resident");
  }
});
const adminAuth = async (req, res, next) => {
  // Check if the user is authenticated as an admin
  if (req.user && req.user.role === 'admin') {
    next(); // Proceed to the next middleware
  } else {
    res.status(403).json({ error: 'Unauthorized' }); // Return a 403 Forbidden error if not authorized
  }
};


// Route to fetch and render resident data
app.get('/viewresident', async (req, res) => {
  try {
    // Fetch all resident data from the database
    const residents = await knex.select('*').from('RESIDENTT');

    // Render the admin dashboard EJS template with resident data
    res.render('viewresident', { residents });
  } catch (error) {
    console.error('Error fetching resident data:', error);
    // Handle the error appropriately
    res.status(500).send('Internal Server Error');
  }
});
// Route for deleting a resident
app.post('/deleteresident', async (req, res) => {
  try {
    const { deleteUserId } = req.body;
console.log(req.body)
    await knex('HAVE').where('USER_ID', deleteUserId).del();
    await knex('PARTICIPATE_IN').where('USER_ID', deleteUserId).del();
    await knex('PAYMENT').where('USER_ID', deleteUserId).del();

    await knex('RESIDENTT').where('USER_ID', deleteUserId).del();
    res.redirect('/viewresident'); // Redirect to admin dashboard after deletion
  } catch (error) {
    console.error('Error deleting caregiver:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get("/userdashboard", IsAuth,  async(_req, res) => {
  console.log(_req.user.USER);

  const user = _req.user.USER;
     const u = await knex('RESIDENTT').where('USER_ID', user);
  res.render("userdashboard", {user : u})
})

app.get("/gallary", (_req, res) => {
  res.render("gallary")
})
app.get("/login", (_req, res) => {
  res.render("login")
  res.render('login', { footer: false });
})
app.get("/signup", (_req, res) => {
  res.render("signup")
})
// app.get("/payment", (_req, res) => {
//   res.render("payment")
// })
// payment
app.post('/payment', IsAuth,async (req, res) => {
  try {
    let user = req.user.USER;
    console.log(req.body);
    const { PAYMENT_ID, PAYMENT_DETAILS, BOOKING_ID, PAYMENT_DATE, PAYMENT_TIME, AMOUNT, PAYMENT_TYPE } = req.body;

    // Assuming EMPLOYEE_ID, PHONE_NO, etc. are the correct keys in req.body
    await knex('PAYMENT').insert({
      PAYMENT_ID: PAYMENT_ID,
      PAYMENT_DETAILS: PAYMENT_DETAILS,
      PAYMENT_DATE: PAYMENT_DATE,
      PAYMENT_TIME: PAYMENT_TIME,
      AMOUNT: AMOUNT,
      PAYMENT_TYPE: PAYMENT_TYPE,
      BOOKING_ID : BOOKING_ID,
      USER_ID : user 

    });

    res.status(200).send('Payment successful'); // Send response after successful insertion
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error'); // Send error response
  }
});
app.post('/insert', async (req, res) => {
  Console.log("chlo");
  console.log(req.body);
});


app.get('/viewpayments', adminIsAuth, async (req, res) => {
  try {
    const payments = await knex('PAYMENT').select('*');
    res.render('viewpayment', { payments });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

//sign up
app.post('/register', async (req, res) => {
  console.log("NEW USER")
  try {
    console.log(req.body)
    const { USER_ID, NAME, EMAIL_ID, PASSWORD, PHONE, GENDER, FLAT, ROLE } = req.body;

    if (!USER_ID || !NAME || !EMAIL_ID || !PASSWORD || !PHONE || !GENDER || !FLAT || !ROLE) {
      return res.status(400).send("All Fields Are Required");
    }

    const exists_user = await knex('RESIDENTT').where("USER_ID", USER_ID);

    if (exists_user.length > 0) {
      console.log(exists_user);
      return res.status(400).send("User Already Exists");
    }

    await knex('RESIDENTT').insert({
      USER_ID: USER_ID,
      NAME: NAME,
      EMAIL_ID: EMAIL_ID,
      PASSWORD: PASSWORD,
      PHONE: PHONE,
      GENDER: GENDER,
      FLAT: FLAT,
      ROLE: ROLE
    });

    res.redirect('/login');

  } 
  catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});
//join data front end
app.get('/booking', IsAuth,async(req, res) => {
  try {
    const userId = req.user.USER;

    // Fetch bookings made by the resident with the specified userId
    const bookingData = await knex('HALLBOOKING')
      .select('HALLBOOKING.BOOKINGID', 'HALLBOOKING.AMOUNT', 'HALLBOOKING.PURPOSE', 'HALLBOOKING.DESCRIPTION', 'HALLBOOKING.STARTDATE', 'HALLBOOKING.ENDDATE', 'HALLBOOKING.STARTTIME', 'HALLBOOKING.ENDTIME', 'RESIDENTT.NAME AS RESIDENT_NAME')
      .join('HAVE', 'HALLBOOKING.BOOKINGID', '=', 'HAVE.BOOKINGID')
      .join('RESIDENTT', 'HAVE.USER_ID', '=', 'RESIDENTT.USER_ID')
      .where('RESIDENTT.USER_ID', userId);
   console.log(bookingData)
    // Pass the booking data to the EJS template for rendering
    res.render('showhallbooking', { bookingData });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

/// show all bookings to admin 
app.get('/bookings', adminIsAuth,async(req, res) => {
  try {

    const userId = req.user.USER;

    // Fetch bookings made by the resident with the specified userId
    const bookingData = await knex('HALLBOOKING')
      .select('HALLBOOKING.BOOKINGID', 'HALLBOOKING.AMOUNT', 'HALLBOOKING.PURPOSE', 'HALLBOOKING.DESCRIPTION', 'HALLBOOKING.STARTDATE', 'HALLBOOKING.ENDDATE', 'HALLBOOKING.STARTTIME', 'HALLBOOKING.ENDTIME', 'RESIDENTT.NAME AS RESIDENT_NAME')
      .join('HAVE', 'HALLBOOKING.BOOKINGID', '=', 'HAVE.BOOKINGID')
      .join('RESIDENTT', 'HAVE.USER_ID', '=', 'RESIDENTT.USER_ID')
   console.log(bookingData)
    // Pass the booking data to the EJS template for rendering
    res.render('showhallbooking', { bookingData });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



app.get("/announcement", (_req, res) => {
  res.render("announcement")
})
//resortbooking
app.post('/announcement', async (req, res) => {
  try {
    console.log(req.body);
    const {WELFARE_ID, ANOUNCEMENT_ID,ANNOUNCEMENT_TITLE, ROLE, SELECT_DATE, SELECT_TIME,ANOUNCEMENT_MESSAGE } = req.body;


// Then, insert the single values into the database
await knex('ANNOUNCEMENT').insert({
  WELFAREID: WELFARE_ID,
  ANNOUNCEMENT_ID: ANOUNCEMENT_ID,
  TITLE: ANNOUNCEMENT_TITLE,
  ROLE: ROLE,
  ANNOUNCEMENT_DATE: SELECT_DATE,
  TIME:SELECT_TIME,
  ANOUNCEMENT_MESSAGE:ANOUNCEMENT_MESSAGE
});

    res.status(200).send(' ANOUNCEMENT_MESSAGE ADDED SUCCESSFUL'); // Send response after successful insertion
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error'); // Send error response
  }
});
app.post('/insert', async (req, res) => {
  Console.log("chlo");
  console.log(req.body);
});

//showing a data in front end
app.get('/abc', async (req, res) => {
  try {
    const announcements = await knex('ANNOUNCEMENT').select('*');
    res.render('viewannouncement', { announcements });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
    res.status(200).send(' ANOUNCEMENT_MESSAGE ADDED SUCCESSFUL'); 
  }
});

// Remove duplicate /register route
// app.post("/register", (req, _res) => {
//   console.log(req.body)
// })

app.get("/admin", (_req, res) => {
  res.render("admin")
})


app.get("/resortbooking", (_req, res) => {
  res.render("resortbooking")
})

//resortbooking
app.post('/resortBooking', IsAuth, async (req, res) => {
  try {
    console.log(req.body);
    const { BOOKING_ID, PAYMENT, PURPOSE, DESCRIPTION, START_DATE, END_DATE, START_TIME, END_TIME } = req.body;
    let user = req.user.USER;
    console.log(user);

    // Then, insert the single values into the database
    let booking = await knex('HALLBOOKING').insert({
      BOOKINGID: BOOKING_ID,
      AMOUNT: PAYMENT,
      PURPOSE: PURPOSE,
      DESCRIPTION: DESCRIPTION,
      STARTDATE: START_DATE,
      ENDDATE: END_DATE,
      STARTTIME: START_TIME,
      ENDTIME: END_TIME
    });
    await knex('HAVE').insert({
      BOOKINGID: BOOKING_ID,
      USER_ID: user
    });

    // Pass the booking details to the payment view
    res.render('payment', { booking: { BOOKING_ID, PAYMENT, PURPOSE, DESCRIPTION, START_DATE, END_DATE, START_TIME, END_TIME } });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/insert', async (req, res) => {
  Console.log("chlo");
  console.log(req.body);
});




//sign up
app.post('/register', async (req, res) => {
  console.log("NEW USER")
  try {
    console.log(req.body)
    const { USER_ID, NAME, EMAIL_ID, PASSWORD, PHONE, GENDER, FLAT, ROLE } = req.body;

    if (!USER_ID || !NAME || !EMAIL_ID || !PASSWORD || !PHONE || !GENDER || !FLAT || !ROLE) {
      return res.status(400).send("All Fields Are Required");
    }

    const exists_user = await knex('RESIDENTT').where("USER_ID", USER_ID);

    if (exists_user.length > 0) {
      console.log(exists_user);
      return res.status(400).send("User Already Exists");
    }

    await knex('RESIDENTT').insert({
      USER_ID: USER_ID,
      NAME: NAME,
      EMAIL_ID: EMAIL_ID,
      PASSWORD: PASSWORD,
      PHONE: PHONE,
      GENDER: GENDER,
      FLAT: FLAT,
      ROLE: ROLE
    });

    res.redirect('/login');
  } 
  catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

//contact
app.get('/contact', (req, res) => {
  res.render('contact');
})

//maintence
app.get('/maintence', async(req, res) => {
  let id = await knex('WELFARECOMMITTEE').select("*")
  console.log(id)
  res.render('maintence',{id});
})

app.get('/viewmaintence', async(req, res) => {
  try {
    // Fetch all maintenance data from the MAINTENANCE table
    const maintenanceData = await knex('MAINTENANCE').select('*');

 console.log(maintenanceData)
    // Pass the maintenance data to the EJS template for rendering
    res.render('showmaintence', { maintenanceData });
    
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



//Maintence 
app.post('/maintence', async (req, res) => {
  console.log("MAINTENCE INFORMATION IS ADDED")
  try {
    console.log(req.body)
    const {WELFARE_COMMITTEE_ID, START_DATE, END_DATE, TYPE, DESCRIPTION, COST} = req.body;

    if (  !START_DATE || !END_DATE || !TYPE || !COST || !DESCRIPTION ) {
      return res.status(400).send("All Fields Are Required");
    }
    await knex('MAINTENANCE').insert({

      START_DATE: START_DATE,
      END_DATE: END_DATE,
      CATEGORY: TYPE,
      WELFAREID : WELFARE_COMMITTEE_ID,
      COST: COST,
      DESCRIPTION: DESCRIPTION  
    });
  } 
  catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});



//LOGIN
app.get('/login', (req, res) => {
  res.render('/login');
})


// POST request for login
app.post('/login', async function (req, res) {
  try {
    console.log(req.body);
    
    const { USER_ID, PASSWORD } = req.body;

    // Check if the fields are empty or not
    if (!USER_ID || !PASSWORD) {
      return res.status(400).send('Please fill all fields');
    }

    // Retrieve user from the database based on USER_ID
    let USER = (await knex('RESIDENTT')).find(U => U.USER_ID == USER_ID);
  

    // Check if the user exists and if the password matches
    if (!USER || USER.PASSWORD != PASSWORD) {
      return res.status(404).send('Invalid credentials');
    } 
    else {
      const jwtKey = 'HOUSING SOCIETY';
      const token = jwt.sign({ USER: USER.USER_ID }, jwtKey, {
        expiresIn: '4h',
      });
      console.log(token);
      res.cookie("token", token, {
        expires: new Date(Date.now() + 3 * 3600 * 1000),
        httpOnly: true
      });
      if(USER.ROLE == 'Resident')
      {

        return res.redirect("/userdashboard");
      }
      else{
        return res.redirect("/admindashboard")
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Login failed. Internal Server Error",
    });
  }
});

