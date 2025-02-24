import React, { useState } from 'react';
import { FaEnvelope, FaUser } from "react-icons/fa";
import { FaLock } from "react-icons/fa6";
import { NavLink, useNavigate } from "react-router-dom";
import './LoginRegister.css';


const LoginRegister = () => {

    const [action, setAction] = useState('');

    const navigate = useNavigate();
    const handleLoginSubmit = (e) => {
        e.preventDefault();
        // Add your login logic here
        navigate('/dashboard')
    };

    const registerLink = () => {
        setAction(' active')
    };
    const loginLink = () => {
        setAction('')
    };
    return (
        <div className="login-register-page">
            {/* Brand icon ở góc trên bên phải */}
            <div className="brand-icon">
                {/* Bạn có thể thay bằng ảnh logo thật hoặc icon */}
                <img src={require('../../assests/Brand-icon.png')} alt="Brand Icon" />
                <h1>Smart Farm</h1>
            </div>
            <div className={`wrapper${action}`}>
                <div className="form-box login">
                    <form action="" onSubmit={handleLoginSubmit}>
                        <h1>Login</h1>
                        <div className="input-box">
                            <input type="text" placeholder='Username' />
                            <FaUser className='icon' />
                        </div>
                        <div className="input-box">
                            <input type="password" placeholder='Password'  />
                            <FaLock className='icon'/>
                        </div>
                        <button type="submit">Login</button>
                        <div className="register-link">
                            <p>Don't have an account? <a href="#" onClick={registerLink}>Register</a></p>
                        </div>
                    </form>
                </div>

                <div className="form-box registration">
                    <form action="">
                        <h1>Registration</h1>
                        <div className="input-box">
                            <input type="text" placeholder='Username' required />
                            <FaUser className='icon' />
                        </div>
                        <div className="input-box">
                            <input type="email" placeholder='Email' required />
                            <FaEnvelope className='icon' />
                        </div>
                        <div className="input-box">
                            <input type="password" placeholder='Password' required />
                            <FaLock className='icon'/>
                        </div>
                        <button type="submit">Login</button>
                        <div className="register-link">
                            <p>Already have an account? <a href="#" onClick={loginLink}>Login</a></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginRegister;