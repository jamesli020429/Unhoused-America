import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import EmbodiconsForm from "./embodicons-form";
import EmbodiconsLaunch from "./embodicons-launch";
import { useSEO } from '../hooks/useSEO';
import './embodicons.css';

function EmbodiconsHome() {
    useSEO({ title: 'Embodicons' });
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const shouldStartForm = location.state?.startForm || searchParams.get('form') === 'true';

    const [showForm, setShowForm] = useState(shouldStartForm);

    useEffect(() => {
        if (shouldStartForm) {
            setShowForm(true);
        }
    }, [shouldStartForm]);

    return (
        <>
            {showForm ? (
                <EmbodiconsForm />
            ) : (
                <EmbodiconsLaunch onStartNew={() => setShowForm(true)} />
            )}
        </>
    );
}
export default EmbodiconsHome;


