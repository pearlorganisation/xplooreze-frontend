import { useEffect, useState } from "react";
import './Policies.css';
import { getCancellationRefundPolicy } from "../../data/modules/dynamic-module";
import HeaderTitle from "../../components/header-title/HeaderTitle";

export default function CancellationRefundPolicy() {
    const [policy, setPolicy] = useState("");

    useEffect(() => {
        async function fetchCancellationRefundPolicy() {
            try {
                const policy = await getCancellationRefundPolicy();
                setPolicy(policy);
            } catch (error) {
                setPolicy('Something went wrong while getting content.');
            }
        }

        fetchCancellationRefundPolicy();
    }, []);

    return (
        <div>
            <HeaderTitle title='Cancellation & Refund' />
            <div className="privacy-container" dangerouslySetInnerHTML={{ __html: policy }} />
        </div>
    );
}