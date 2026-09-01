const db = require('./database');
setTimeout(() => {
    db.run("DELETE FROM reports WHERE company_name LIKE 'Project #%'", function(err) {
        if(err) console.error(err);
        else console.log(`Deleted ${this.changes} anonymous reports.`);
    });
}, 1000);
