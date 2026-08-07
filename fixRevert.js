const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf-8');

// 1. Add cardsBackup state definition
code = code.replace(
  `  const [activeSheet, setActiveSheet] = useState(null);`,
  `  const [activeSheet, setActiveSheet] = useState(null);
  const [cardsBackup, setCardsBackup] = useState(null);`
);

// 2. Add useEffect for backup/restore
const backupEffect = `  // Handle cards backup and restore on sheet open/close to support discarding changes
  useEffect(() => {
    if (activeSheet !== null) {
      setCardsBackup(JSON.parse(JSON.stringify(cards)));
    } else {
      if (cardsBackup) {
        setCards(cardsBackup);
        setCardsBackup(null);
      }
    }
  }, [activeSheet]);`;

code = code.replace(
  `  // Clear local contact and medication input fields and validation errors when switching cards`,
  backupEffect + `\n\n  // Clear local contact and medication input fields and validation errors when switching cards`
);

// 3. Clear backup upon successful save in saveCollection
code = code.replace(
  `      if (result.success) {
        showStatus('Changes saved successfully.', 'success');
        return true;`,
  `      if (result.success) {
        showStatus('Changes saved successfully.', 'success');
        setCardsBackup(null);
        return true;`
);

fs.writeFileSync('frontend/src/App.jsx', code, 'utf-8');
console.log('App.jsx successfully updated with memory revert/discard logic!');
