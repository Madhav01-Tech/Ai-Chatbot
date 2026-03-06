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
    credits:{
        type:Number,
        default:7,
    }
  
});

export const User = mongoose.models.User || mongoose.model("User", userSchema)