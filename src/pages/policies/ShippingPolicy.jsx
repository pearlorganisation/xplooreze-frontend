import { useEffect, useState } from "react";
import './Policies.css';
import { getShippingPolicy } from "../../data/modules/dynamic-module";
import HeaderTitle from "../../components/header-title/HeaderTitle";

export default function ShippingPolicy() {
    const [policy, setPolicy] = useState("");

    useEffect(() => {
        async function fetchShippingPolicy() {
            try {
                const policy = await getShippingPolicy();
                setPolicy(policy);
            } catch (error) {
                setPolicy('Something went wrong while getting content.');
            }
        }

        fetchShippingPolicy();
    }, []);

    return (
        <div>
            <HeaderTitle title='Shipping Policy' />
            <div className="privacy-container" dangerouslySetInnerHTML={{ __html: policy }} />
        </div>
    );
}