var express=require("express");
var router =express.Router();
bike                    =require("../models/bike_model"),
orders                  =require("../models/order"),
histories               =require("../models/history"),
wishlists               =require("../models/wishlist"),
indicator               =require("../models/indicator");

const crypto                =require("crypto");
const sgMail                =require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//===============================================================================================================

router.get("/contact",isLoggedin,function(req,res){
    res.render("contact");
})

router.post("/contact",async function(req,res){
    const msg = {
        to: "maharshiduttsharma@gmail.com",
        from: req.user.email, // Use the email address or domain you verified above
        subject: req.body.subject,
        text: req.body.text,
        html: `<strong>${req.body.text}</strong>`,
      };

    try {
        await sgMail.send(msg);
        req.flash("success","Your message has been sent to our database...thankyou for your time...");
        res.redirect("/");
    } catch (error) {
        console.error(error);
    
    if (error.response) {
        console.error(error.response.body)
    }
        req.flash("error","Sorry!! somthing went wrong Please contact us via call....");
        res.redirect("/landing");
    }
})


router.get("/register",function(req,res){
    res.render("register");
})

router.post("/register",function(req,res){
    var newUser = new User({
        username:req.body.username,
        email:req.body.email,
        emailToken:crypto.randomBytes(64).toString('hex'),
        isVerified:false
    });

    User.register(newUser,req.body.password,async function(err,user){
        if(err){
            req.flash("error",err.message);
            return  res.redirect("/register");
        }
        const msg = {
            to: user.email,
            from: 'maharshiduttsharma@gmail.com', // Use the email address or domain you verified above
            subject: 'IMS Cables & Indicators - varify your email',
            text:  `Hello, ........... Please copy the link http://${req.headers.host}/verify-email?token=${user.emailToken}`,
            html: `
                <h1>Hello,</h1>
                <p>Thanks for registrating on our site...</p>
                <p>Please varify your Email Account by clicking on the link...</p>
                <a href="http://${req.headers.host}/verify-email?token=${user.emailToken}">Verify your account</a>
            `,
          };
          try{
              await sgMail.send(msg);
              req.flash("success","Thankyou for registraing...Please click the link send on your given mail to complete the registration.  :] ");
              res.redirect("/register");
          }catch(error){
              console.log(error);
              req.flash("error","Please enter a correct email address so we can trust your authentication..");
              res.redirect("/register");
          }
    })
})
router.get("/verify-email",async function(req,res,next){
    try{
        const user=await User.findOne({emailToken:req.query.token });
        if(!user){
            req.flash("error","Token is invalid... Please try agian later..");
            console.log("Invalid Token");
            return res.redirect("/");
        }
        user.emailToken=null;
        user.isVerified=true;
        await user.save();
        await req.login(user,async(err) =>{
            if(err) return next(err);
            req.flash("success",`Welcome to IMS ${user.username}`);
            const redirectUrl = req.session.redirectTo || '/';
            delete req.session.redirectTo;
            res.redirect(redirectUrl);
        });
    }catch(error){
        console.log(error);
        res.redirect("/");
    }
})


//Login=============================================================
router.get("/login",function(req,res){
    res.render("login");
})

router.post("/login",passport.authenticate("local",{
    successRedirect:"/",
    failureRedirect:"/login"
}),function(req,res){
})

//logout=============================================================
router.get("/logout",function(req,res){
    req.logout();
    req.flash("success"," You have successfully logged out.");
    res.redirect("/");
})

function isLoggedin(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}


module.exports = router;