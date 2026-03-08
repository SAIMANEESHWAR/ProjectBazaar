async function checkPortals() {
    try {
        const res = await fetch('https://h5bib353ti.execute-api.ap-south-2.amazonaws.com/default/prep_user_handler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'list_with_progress', contentType: 'job_portals', limit: 5 })
        });
        const data = await res.json();
        const items = data.items || [];
        console.log(`Found ${items.length} portals.`);
        if (items.length > 0) {
            console.log("First portal details:", JSON.stringify(items[0], null, 2));
            const logos = items.map(i => i.logo).filter(Boolean);
            console.log(`Logos count: ${logos.length}`);
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

checkPortals();
