import React from 'react';
import { Link } from 'react-router-dom';
import { TbDeviceDesktopCog } from "react-icons/tb";
import { PiPlantBold } from "react-icons/pi";
import { CiMedicalCase } from "react-icons/ci";
import { IoBarChart } from "react-icons/io5";
import { MdDashboard } from "react-icons/md";

import './navigator.css';

const Navigator = () => {
  return (
    <div className="navigator">
      {/* Smart farm logo placeholder */}
      <div className="logo">
      <img src={require('../../assests/Brand-icon.png')} alt="Brand Icon" />
        <h1>Smart Farm</h1>
      </div>
      <ul>
        <li>
          <Link to="/dashboard">
            <MdDashboard className="icon" />
            <span>Dashboard</span>
          </Link>
        </li>
        <li>
          <Link to="/analyst">
            <IoBarChart className="icon" />
            <span>Analyst</span>
          </Link>
        </li>
        <li>
          <Link to="/plant">
            <PiPlantBold className="icon" />
            <span>Plant</span>
          </Link>
        </li>
        <li>
          <Link to="/device">
            <TbDeviceDesktopCog className="icon" />
            <span>Device</span>
          </Link>
        </li>
        <li>
          <Link to="/healthcare">
            <CiMedicalCase className="icon" />
            <span>Healthcare</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Navigator;