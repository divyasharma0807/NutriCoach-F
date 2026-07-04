const fs = require('fs');
const file = 'src/pages/CoachDashboard/CoachDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace headers with subtitles
const regex = /<div className="section-header"([^>]*)>\s*<div>\s*<h2>([^<]+)<\/h2>\s*<p className="section-subtitle">([^<]+)<\/p>\s*<\/div>/g;
content = content.replace(regex, (match, attrs, h2, p) => {
  return `<div className="section-header"${attrs}>\n            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>\n              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0, marginTop: '2px' }}>←</button>\n              <div>\n                <h2 style={{ margin: 0, lineHeight: 1 }}>${h2}</h2>\n                <p className="section-subtitle" style={{ margin: '0.25rem 0 0 0' }}>${p}</p>\n              </div>\n            </div>`;
});

// Replace simple headers on one line
const regexSimple = /<div className="section-header"><h2>([^<]+)<\/h2><\/div>/g;
content = content.replace(regexSimple, (match, h2) => {
  return `<div className="section-header">\n            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>\n              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>\n              <h2 style={{ margin: 0 }}>${h2}</h2>\n            </div>\n          </div>`;
});

// Replace simple headers on multiple lines
const regexSimpleMulti = /<div className="section-header">\s*<h2>([^<]+)<\/h2>\s*<\/div>/g;
content = content.replace(regexSimpleMulti, (match, h2) => {
  return `<div className="section-header">\n            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>\n              <button className="back-to-dashboard-btn" onClick={() => setCurrentSection('dashboard')} title="Back to Dashboard" style={{ margin: 0 }}>←</button>\n              <h2 style={{ margin: 0 }}>${h2}</h2>\n            </div>\n          </div>`;
});

fs.writeFileSync(file, content);
console.log('Headers updated!');
