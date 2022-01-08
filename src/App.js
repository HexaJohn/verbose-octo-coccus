import React, { useEffect, useState } from "react";
import logo from './cryodrive-icon-fullcolor-square.png';
import './App.css';
import Amplify, { Auth, Hub } from "aws-amplify";
import { AmplifyAuthenticator, AmplifySignOut, AmplifySignIn, a } from '@aws-amplify/ui-react';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import config from './aws-exports';

import {PaymentElement} from '@stripe/react-stripe-js';
import {Elements} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';
import SetupForm from './SetupForm';

Amplify.configure(config);

const stripePromise = loadStripe('pk_test_51J99fLE8TXuYTMnRE9dGctQxw2CCClkRzcM3ExvWuzjhDGVHBviF5Y3mK6dth0hb120Ej0mG0YpSBolVCmcQZwHM00rcg3RYqb');

/**
 * This code is based on Nader Dabit's tutorial for custom Cognito authentication
 * using AWS Amplify and React: https://www.youtube.com/watch?v=JaVu-sS3ixg&t=24s
 *
 * It's 99% the same as the video, but I've sprinkled a few niceties here and there.
 */
  
 const initialFormState = {
   username: "",
   password: "",
   email: "",
   authCode: "",
   formType: "signIn",
 };
 
 function App() {



   const [formState, updateFormState] = useState(initialFormState);
 
   const [user, updateUser] = useState(null);


   const updateOptions = async () => {
     presetOptions['clientSecret'] = Auth.userAttributes();
   }
 
   var presetOptions = {
    // passing the client secret obtained in step 2
    clientSecret: 'seti_1KFGTRE8TXuYTMnRQDB0pdF2_secret_Kv6gnytqPpYsjNKFCK2ueu7RhkFT02r',
    // Fully customizable with appearance API.
    appearance: {/*...*/},
    };

   const checkUser = async () => {
     try {
       const user = await Auth.currentAuthenticatedUser();
 
       updateUser(user);
 
       console.log("got user", user);
 
       updateFormState(() => ({ ...formState, formType: "signedIn" }));
     } catch (err) {
       console.log("checkUser error", err);
       updateFormState(() => ({ ...formState, formType: "signIn" }));
     }
   };
 
   // Skip this if you're not using Hub. You can call updateFormState function right
   // after the Auth.signOut() call in the button.
   
   const setAuthListener = async () => {
     Hub.listen("auth", (data) => {
       switch (data.payload.event) {
         case "signOut":
           console.log(data);
 
           updateFormState(() => ({
             ...formState,
             formType: "signIn",
           }));
 
           break;
         case "signIn":
           console.log(data);
 
           break;
       }
     });
   };
   
 
   useEffect(() => {
     checkUser();
     setAuthListener();
   }, []);
 
   const onChange = (e) => {
     e.persist();
     updateFormState(() => ({ ...formState, [e.target.name]: e.target.value }));
   };
 
   const { formType } = formState;
 
   const signUp = async () => {
     const { username, email, password } = formState;
 
     await Auth.signUp({ username, password, attributes: { email } });
 
     updateFormState(() => ({ ...formState, formType: "confirmSignUp" }));
   };
 
   const confirmSignUp = async () => {
     const { username, authCode } = formState;
 
     await Auth.confirmSignUp(username, authCode);
 
     updateFormState(() => ({ ...formState, formType: "signIn" }));
   };
 
   const signIn = async () => {
     const { username, password } = formState;
 
     await Auth.signIn(username, password);
 
     updateFormState(() => ({ ...formState, formType: "signedIn" }));

     presetOptions['clientSecret'] = user.attributes["custom:StripeClientSecret"];

     console.log("updated options", presetOptions);

   };
 
   // console.log(formType);
 
   return (
     <>
       <h1>App</h1>
 
       {formType === "signIn" && (
         
         <div>
           <p>Welcome back</p>
           <p>Because you're accessing sensitive info, you need to verify your password.</p>
           <input name="username" onChange={onChange} placeholder="username" />
           <input
             name="password"
             type="password"
             onChange={onChange}
             placeholder="password"
           />
           <button onClick={signIn}>Sign In</button>

         </div>
       )}
 
       {formType === "signedIn" && (
         <div>
           <h2>
             Welcome the app. {user.username}
           </h2>
            <Elements stripe={stripePromise} options={presetOptions}>
              <SetupForm />
            </Elements>
           <button
             onClick={() => {
               Auth.signOut();
             }}
           >
             Sign out
           </button>
         </div>
       )}
 
       <hr />
     </>
   );
 }
 
 export default App;