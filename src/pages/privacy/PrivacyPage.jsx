import { useEffect, useState } from "react";
import './PrivacyPage.css';
import { getPrivacy } from "../../data/modules/dynamic-module";
import HeaderTitle from "../../components/header-title/HeaderTitle";

export default function PrivacyPage() {
    const [privacy, setPrivacy] = useState("");

    useEffect(() => {
        async function fetchPrivacy() {
            try {
                const privacyContent = await getPrivacy();
                setPrivacy(privacyContent);
            } catch (error) {
                setPrivacy('Something went wrong while getting privacy policy.');
            }
        }

        fetchPrivacy();
    }, []);

    return (
        <div>
            <HeaderTitle title='Privacy Policy' />
            <div className="privacy-container" dangerouslySetInnerHTML={{ __html: privacy }} />
        </div>
    );
}