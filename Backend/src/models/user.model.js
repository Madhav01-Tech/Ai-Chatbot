import { Schema } from "mongoose";
import mongoose from "mongoose";

const userSchema = new Schema({
    name : {
        type : String,
        required :true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    isVerified:{
        type:Boolean,
        default:false,
    },
    otp:{
        type:String,
    },
    otpExpires:{
        type:Date,
    },
    credits:{
        type:Number,
        default:100,
    }
  
});

export const User = mongoose.models.User || mongoose.model("User", userSchema)