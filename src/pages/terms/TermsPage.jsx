import { useEffect, useState } from "react";
import './TermsPage.css';
import { getPrivacy, getTerms } from "../../data/modules/dynamic-module";
import HeaderTitle from "../../components/header-title/HeaderTitle";

export default function TermsPage() {
    const [terms, setTerms] = useState("");

    useEffect(() => {
        async function fetchTerms() {
            try {
                const termsContent = await getTerms();
                setTerms(termsContent);
            } catch (error) {
                setTerms('Something went wrong while getting Terms & Conditions.');
            }
        }

        fetchTerms();
    }, []);

    return (
        <div>
            <HeaderTitle title='Terms & Conditions' />
            <div className="terms-container" dangerouslySetInnerHTML={{ __html: terms }} />
        </div>
    );
}