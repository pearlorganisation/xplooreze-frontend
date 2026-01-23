import { useState } from "react";
import { FaRegSun, FaSun, FaRegSmileBeam, FaRegMoon, FaCloud, FaMoon, FaBed, FaCross, FaTimes } from "react-icons/fa";
import { WiSunrise } from "react-icons/wi";
import "./slot_selector.css";

export default function SlotSelector({ show, onSelectionChange, initialSlots = [], initialDays = [] }) {
    const timeSections = {
        Daytime: [
            { label: "9-12", icon: FaRegSun }, 
            { label: "12-15", icon: FaSun },
            { label: "15-18", icon: FaRegSmileBeam }
        ],
        "Evening and night": [
            { label: "18-21", icon: FaRegMoon },
            { label: "21-24", icon: FaCloud },
            { label: "0-3", icon: FaMoon }
        ],
        Morning: [
            { label: "3-6", icon: FaBed },
            { label: "6-9", icon: WiSunrise }
        ]
    };

    const weekends = ["Sun", "Sat"];
     const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

    const [selectedSlots, setSelectedSlots] = useState([...initialSlots]);
    const [selectedDays, setSelectedDays] = useState([...initialDays]);

    const toggleSlot = (slot) => {
        const updated = selectedSlots.includes(slot)
            ? selectedSlots.filter(s => s !== slot)
            : [...selectedSlots, slot];
        setSelectedSlots(updated);
    };

    const toggleDay = (day) => {
        const updated = selectedDays.includes(day)
            ? selectedDays.filter(d => d !== day)
            : [...selectedDays, day];
        setSelectedDays(updated);
    };

    return (
        <div className={`slot-drawer ${show ? "open" : ""}`}>
            {show && (
                <div className="slot-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="header">
                    <h1>Select Availability</h1>
                    <FaTimes className="icon" onClick={() => onSelectionChange?.({})} />
                </div>


                <h3>Days</h3>
                <div className="options days">
                    {days.map(day => (
                        <button
                            key={day}
                            type="button"
                            className={`option-btn ${selectedDays?.includes(day) === true ? "selected" : ""}`}
                            onClick={() => toggleDay(day)}
                        >
                            {day}
                        </button>
                    ))}
                </div>
                <div className="options days">
                    {weekends.map(day => (
                        <button
                            key={day}
                            type="button"
                            className={`option-btn ${selectedDays?.includes(day) === true ? "selected" : ""}`}
                            onClick={(e) => {
                                e.preventDefault();
                                toggleDay(day);
                            }}
                        >
                            {day}
                        </button>
                    ))}
                </div>
                <h3>Times</h3>
                {Object.entries(timeSections).map(([section, slots]) => (
                    <div key={section} className="section">
                        <h4>{section}</h4>
                        <div className="options">
                            {slots.map(({ label, icon: Icon }) => (
                                <button
                                    key={label}
                                    type="button"
                                    className={`option-btn ${selectedSlots.includes(label) ? "selected" : ""}`}
                                    onClick={() => toggleSlot(label)}
                                >
                                    <Icon className="icon" />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
                <button
                    id="submit"
                    type="button"
                    onClick={() => {
                        onSelectionChange?.({ avl_time: selectedSlots || [], avl_days: selectedDays || [] });
                    }}
                >Submit →</button>
            </div>
            )}
        </div>
    );
}