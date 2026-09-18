// src/embodicons/embodicons-form.js
import React from "react";
import { useNavigate } from "react-router-dom";
import './embodicons.css';

const isMobile = () => window.innerWidth <= 768;

const questions = [
    {
        id: "q1",
        type: "single",
        autoAdvance: true,
        question: "What city do you live in?",
        options: [
            {
                label: "Atlanta, GA",
                description: "In 2024, Atlanta counted 2,867 people experiencing homelessness.",
                source:"",
                image: "/embodicons/atlanta.svg"
            },
            {
                label: "Boston, MA",
                description: "From 2024 to 2025, Boston’s homeless count fell 5,756→5,506 (–4.3%). Adults increased 2,036→2,122 (+4.2%). People in families fell 3,720→3,384 (–9%).",
                source:"",
                image: "/embodicons/boston.svg"
            },
            {
                label: "Los Angeles, CA",
                description: "In 2024, LA County counted ~75,312 people experiencing homelessness; 45,252 were in the City of LA.",
                source:"",
                image: "/embodicons/la.svg"
            },
            {
                label: "New York, NY",
                description: "In 2024, more than 158,000 people in New York experienced homelessness, about 1 in 5 of all people homeless in the U.S. ",
                source:"",
                image: "/embodicons/nyc.svg"
            },
            {
                label: "Portland, OR",
                description: "Most nights, shelter beds in Multnomah County are close to full, with a high percentage of beds occupied.",
                source:"",
                image: "/embodicons/portland.svg"
            },
            {
                label: "Washington, DC",
                description: "In 2024, DC counted 5,616 people experiencing homelessness: 3,960 unaccompanied individuals and 1,656 people in 539 family households.",
                source:"",
                image: "/embodicons/dc.svg"
            }
        ]
    },
    {
        id: "q2",
        type: "multi",
        autoAdvance: false,
        question: "How do you present?",
        options: [
            {
                label: "Masculine",
                description: "",
                source:""
            },
            {
                label: "Feminine",
                description: "",
                source:""
            },
            {
                label: "Androgynous",
                description: "",
                source:""
            },
        ]
    },
    {
        id: "q3",
        type: "multi",
        autoAdvance: false,
        question: "What is your gender?",
        options: [
            {
                label: "Cisgender",
                description: "",
                source:""
            },
            {
                label: "Transgender",
                description: "",
                source:""
            },
            {
                label: "Non-binary",
                description: "",
                source:""
            },
            {
                label: "Other",
                description: "",
                source:""
            }
        ]
    },
    {
        id: "q4",
        type: "multi",
        autoAdvance: false,
        question: "What is your race/ethnicity?",
        options: [
            { 
                label: "White", 
                description: "",
                source:"" },
            { 
                label: "Hispanic/Latino", 
                description: "",
                source:"" },
            { 
                label: "Black/African American", 
                description: "",
                source:"" },
            { 
                label: "Asian", 
                description: "",
                source:"" },
            { 
                label: "Middle Eastern", 
                description: "",
                source:"" },
            { 
                label: "American Indian and Alaska Native", 
                description: "",
                source:"" },
            { 
                label: "Native Hawaiian and Other Pacific Islander", 
                description: "",
                source:"" }
        ]
    },
    {
        id: "q5",
        type: "multi",
        autoAdvance: false,
        question: "What is your sexual orientation?",
        options: [
            { label: "Asexual", description: "", source:"" },
            { label: "Bisexual", description: "", source:"" },
            { label: "Heterosexual", description: "", source:"" },
            { label: "Gay", description: "", source:"" },
            { label: "Lesbian", description: "", source:"" },
            { label: "Pansexual", description: "", source:"" },
            { label: "Queer", description: "", source:"" },
            { label: "Other", description: "", source:"" }
        ]
    },
    {
        id: "q6",
        type: "single",
        autoAdvance: true,
        question: "What is your marital status?",
        options: [
            { label: "Single", description: "", source:"" },
            { label: "Married", description: "", source:"" },
            { label: "Divorced", description: "", source:"" },
            { label: "Widowed", description: "", source:"" },
            { label: "Separated", description: "", source:"" },
            { label: "Other", description: "", source:"" }
        ]
    },
    {
        id: "q7",
        type: "single",
        autoAdvance: true,
        question: "How many dependent children do you have?",
        options: [
            { label: "0", description: "", source:"" },
            { label: "1", description: "", source:"" },
            { label: "2", description: "", source:"" },
            { label: "3+", description: "", source:"" }
        ]
    },
    {
        id: "q8",
        type: "single",
        autoAdvance: true,
        question: "How old are you?",
        options: [
            { label: "Under 18", description: "", source:"" },
            { label: "18-24", description: "", source:"" },
            { label: "25-34", description: "", source:"" },
            { label: "35-44", description: "", source:"" },
            { label: "45-54", description: "", source:"" },
            { label: "55-64", description: "", source:"" },
            { label: "65+", description: "", source:"" }
        ]
    },
    {
        id: "q10",
        type: "single",
        autoAdvance: true,
        question: "What is the highest level of education you have completed?",
        options: [
            { label: "12th grade or less", description: "", source:"" },
            { label: "High school diploma or equivalent", description: "", source:"" },
            { label: "Some college", description: "", source:"" },
            { label: "Associate degree", description: "", source:"" },
            { label: "Bachelor's degree", description: "", source:"" },
            { label: "Graduate or professional degree", description: "", source:"" }
        ]
    },
    {
        id: "q9",
        type: "multi",
        autoAdvance: false,
        question: "Do you have any disabilities?",
        options: [
            { label: "Physical disability", description: "", source:"" },
            { label: "Mental or psychological disability", description: "", source:"" },
            { label: "Sensory disability", description: "", source:"" },
            { label: "Cognitive or intellectual disability", description: "", source:"" },
            { label: "Addiction", description: "", source:"" },
            { label: "HIV/AIDS", description: "", source:"" },
            { label: "Other", description: "", source:"" },
            { label: "None", description: "", source:"" }
        ]
    }
];
function EmbodiconsForm() {
    const [currentStep, setCurrentStep] = React.useState(0);
    const [selections, setSelections] = React.useState({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [hoveredOption, setHoveredOption] = React.useState(null);
    const [hoveredPosition, setHoveredPosition] = React.useState(null);
    const [displayOpacity, setDisplayOpacity] = React.useState(0);
    const navigate = useNavigate();
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8787';

    const currentQuestion = questions[currentStep];

    // Handle smooth fade in/out
    React.useEffect(() => {
        if (hoveredOption) {
            // Small delay to trigger transition
            const timer = setTimeout(() => setDisplayOpacity(1), 10);
            return () => clearTimeout(timer);
        } else {
            setDisplayOpacity(0);
        }
    }, [hoveredOption]);

    // Clear hovered option when question changes
    React.useEffect(() => {
        setHoveredOption(null);
        setDisplayOpacity(0);
    }, [currentStep]);

    // Get the newest/last selected option for mobile display
    const getLastSelectedOption = () => {
        const questionSelections = selections[currentQuestion.id];
        if (!questionSelections) return null;
        if (typeof questionSelections === "string") {
            return currentQuestion.options.find(opt => opt.label === questionSelections);
        }
        if (Array.isArray(questionSelections) && questionSelections.length > 0) {
            const lastLabel = questionSelections[questionSelections.length - 1];
            return currentQuestion.options.find(opt => opt.label === lastLabel);
        }
        return null;
    };

    function handleOptionSelect(option) {
        if (currentQuestion.type === "single") {
            setSelections((prev) => ({ ...prev, [currentQuestion.id]: option.label }));
            if (!isMobile() && currentQuestion.autoAdvance) nextStep();
        } else {
            setSelections((prev) => {
                const prevSelected = prev[currentQuestion.id] || [];
                let newSelected;
                if (prevSelected.includes(option.label)) {
                    newSelected = prevSelected.filter((l) => l !== option.label);
                } else {
                    newSelected = [...prevSelected, option.label];
                }
                return { ...prev, [currentQuestion.id]: newSelected };
            });
        }
    }

    function nextStep() {
        setCurrentStep((step) => step + 1);
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (currentStep < questions.length - 1) {
            // For multi-choice questions in the middle, just advance
            nextStep();
            return;
        }

        // Last question: build payload and send to backend
        try {
            setIsSubmitting(true);
            setError(null);

            const payload = buildBackendPayload(selections);
            // Add isDay here – you can change this based on another selection later
            payload.isDay = true;
            const res = await fetch(`${API_BASE}/api/personas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || data.error || "Error creating persona");
            }
            // Navigate to the persona page
            navigate(`/embodicons/persona/${data.id}`);
        } catch (err) {
            console.error(err);
            setError(err.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    }

    // Transform selections -> backend payload
    function buildBackendPayload(selections) {
        // City (q1)
        const cityLabel = selections["q1"] || "";
        const cityName = (cityLabel.split(",")[0] || "").trim();
        const cityKey = cityName.toLowerCase();
        const cityAliases = {
            'new york': 'New York',
            'nyc': 'New York',
            'los angeles': 'Los Angeles',
            'la': 'Los Angeles',
            'washington': 'Washington, DC',
            'dc': 'Washington, DC',
            'boston': 'Boston',
            'atlanta': 'Atlanta',
            'portland': 'Portland'
        };
        const city = cityAliases[cityKey] || cityName;

        // Helper to join multi-selects
        const join = (val) => Array.isArray(val) ? val.join(", ") : (val || "");

        const genderExpression = join(selections["q2"]);
        const genderIdentity = join(selections["q3"]);
        const raceEthnicity = join(selections["q4"]);
        const sexualOrientation = join(selections["q5"]);
        const relationshipStatus = selections["q6"] || "";
        const numChildren = selections["q7"] || "0";
        const ageRange = selections["q8"] || "";
        const disabilitySelections = join(selections["q9"]);
        const education = selections["q10"] || "";

        // Parent status (you can refine wording later)
        let parentStatus = "no dependent children";
        if (numChildren === "1") parentStatus = "parent of 1 child";
        else if (numChildren === "2") parentStatus = "parent of 2 children";
        else if (numChildren === "3+") parentStatus = "parent of 3 or more children";

        const disabilityStatus = disabilitySelections || "None";

        return {
            city,
            demographics: {
                genderExpression,
                genderIdentity,
                raceEthnicity,
                sexualOrientation,
                relationshipStatus,
                parentStatus,
                ageRange,
                disabilityStatus,
                education
            }
        };
    }

    if (isSubmitting) {
        return (
            <div className="main-content embodicons loading-screen">
                <div className="loading-circle"></div>
                <div className="loading-content">
                    <h2>Generating your persona...</h2>
                    <p>This may take a few moments.</p>
                </div>
            </div>
        );
    }

    if (currentStep >= questions.length) {
        // This state should no longer be reachable because we submit on the last question,
        // but keep it as a fallback.
        return (
            <div>
                <h2>Preparing your persona...</h2>
            </div>
        );
    }

    return (
        <div className="main-content embodicons lightbg">
            <form className="embodicons-form" onSubmit={handleSubmit}>
                <h2>{currentQuestion.question}</h2>
                {currentQuestion.type === "multi" && (
                    <p className="embodicons-form-selectall">
                        Select all that apply
                    </p>
                )}
                <div className="embodicons-form-options">
                    {currentQuestion.options.map((option) => {
                        const isSelected =
                            currentQuestion.type === "single"
                                ? selections[currentQuestion.id] === option.label
                                : (selections[currentQuestion.id] || []).includes(option.label);

                        const handleMouseEnter = (e) => {
                            if (!isMobile()) {
                                setHoveredOption(option);
                                setHoveredPosition({ x: e.clientX, y: e.clientY });
                            }
                        };

                        const handleMouseMove = (e) => {
                            if (!isMobile()) {
                                setHoveredPosition({ x: e.clientX, y: e.clientY });
                            }
                        };

                        const handleMouseLeave = () => {
                            if (!isMobile()) {
                                setHoveredOption(null);
                                setHoveredPosition(null);
                            }
                        };

                        const handleClickMobile = () => {
                            handleOptionSelect(option);
                            if (!isMobile()) return;
                            // On mobile, show selected option
                            setHoveredOption(isSelected ? null : option);
                        };

                        return (
                            <button
                                className={`embodicons-form-button ${isSelected ? 'selected' : ''}`}
                                type="button"
                                key={option.label}
                                onClick={isMobile() ? handleClickMobile : () => handleOptionSelect(option)}
                                onMouseEnter={handleMouseEnter}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                            >
                                <span>{option.label}</span>
                            </button>
                        );
                    })}

                </div>

                {hoveredOption && (
                    <div
                        className="embodicons-form-hover-display"
                        style={{
                            opacity: displayOpacity,
                            transition: 'opacity 0.5s ease'
                        }}
                    >
                        {hoveredOption.image ? (
                            <img
                                src={hoveredOption.image}
                                alt={hoveredOption.label}
                            />
                        ) : (
                            <div className="embodicons-form-hover-label">{hoveredOption.label}</div>
                        )}
                    </div>
                )}

                {hoveredOption && hoveredOption.description && !isMobile() && (
                    <div
                        className="embodicons-form-options-details"
                        style={{
                            position: "fixed",
                            left: `${(hoveredPosition?.x || 0) + 10}px`,
                            top: `${(hoveredPosition?.y || 0) + 10}px`,
                            zIndex: 1000,
                            maxWidth: "250px",
                            padding: "8px 12px",
                            color: "#000",
                            backgroundColor: "#fff",
                            border: "1px solid #000",
                            borderRadius: "6px",
                            fontSize: "0.85em",
                            pointerEvents: "none"
                        }}
                    >
                        {hoveredOption.description}
                    </div>
                )}

                {hoveredOption && hoveredOption.description && isMobile() && (
                    <div
                        className="embodicons-form-options-details"
                        style={{
                            marginTop: "15px",
                            padding: "8px 12px",
                            backgroundColor: "#f9f9f9",
                            border: "1px solid #ccc",
                            borderRadius: "6px",
                            fontSize: "0.85em"
                        }}
                    >
                        {hoveredOption.description}
                    </div>
                )}

                {/* Show a Next/Generate button for:
    - any multi question, OR
    - the last question, OR
    - mobile (all questions need manual progression) */}
                {(currentQuestion.type === "multi" || currentStep === questions.length - 1 || isMobile()) && (
                    <button
                        className="embodicons-form-submit"
                        type="submit"
                        disabled={!selections[currentQuestion.id] ||
                            (Array.isArray(selections[currentQuestion.id]) && selections[currentQuestion.id].length === 0)}
                    >
                        {currentStep === questions.length - 1 ? "Generate persona" : "Next"}
                    </button>
                )}

                {error && (
                    <div style={{ marginTop: 16, color: "red" }}>
                        {error}
                    </div>
                )}
            </form>
        </div>
    );
}

export default EmbodiconsForm;