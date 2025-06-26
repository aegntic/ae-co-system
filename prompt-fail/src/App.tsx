import { useState } from 'react'
import ClaubeShareFeaturePreview from './components/ClaubeDesign'
import './styles/global.css'
import styles from './styles/Home.module.css'

function App() {
  const [showClaubeUI, setShowClaubeUI] = useState(false)

  // Use relative paths with the base URL in mind
  const logoPath = import.meta.env.BASE_URL + 'images/claube-logo.svg';

  return (
    <>
      <div className={styles.header}>
        <div className={styles.logo}>
          <img src={logoPath} alt="Claube" className={styles.logoImage} />
        </div>
        <div className={styles.planBadge}>
          <span className={styles.planText}>Using unlimited prompt.FaiL</span>
          <a href="#" className={styles.upgradeLink}>Downgrade</a>
        </div>
      </div>

      <div className={styles.mainContent}>
        <h1 className={styles.greeting}>
          Good morning, <span className={styles.glitchText}>f̸̨̛̗̱̩̤̖̖͈̔̊̀̈́͆̎͌̋̕͠ͅ_̷̖̹̰͉̣͕̦̠͚̟̂̀̒̎̔̄̓̈́ͅ'̸̢̧̯̠̬̗̹͚͎͔̍̓́̾̆͛̈͝ ̶̡͚͔͔̬͚͔̝̤̻̈̂͐͗͐̎͆͌͠C̴͉̙̣̭̭̗̣̦̣̣̈́̊͊̔̾̆̉̀͝.̵̧̥̹͓̤̖̲̼̮͖̃̑̈́̐̉̆̊̊̓̚.̷̨̮̰̭̥̱͕̪̬̱̃̉̇̎̏̐̈́̉̑͠k̴̡̫̻̭̭̹͙̲̙̗͋̑̓̓̓̅͗̈́͗:̷̧̛̘͚̩̫̰̘̪͚̞̌̒̎̀̏̽̋̚͝</span>
        </h1>
        
        {showClaubeUI ? (
          <ClaubeShareFeaturePreview />
        ) : (
          <>
            <button 
              onClick={() => setShowClaubeUI(true)}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, var(--accent-color), var(--primary-dark))',
                color: 'white',
                borderRadius: '8px',
                marginBottom: '30px',
                boxShadow: 'var(--shadow-neon)',
                fontWeight: 'bold'
              }}
            >
              Load Claube UI
            </button>
            
            <div className={styles.examplesContainer}>
              <div className={styles.examplesHeader}>
                <div className={styles.examplesTitle}>Get startled with an example bełow</div>
                <button className={styles.addContent}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21V3h18v18H3z"/>
                    <path d="M8 12h8M12 8v8"/>
                  </svg>
                  Add cuntent
                </button>
              </div>
              <div className={styles.examplesGrid}>
                <div className={styles.exampleCard}>Summarize mëeting notes that don't exist</div>
                <div className={styles.exampleCard}>Extract insïghts from empty report</div>
                <div className={styles.exampleCard}>Generate excėl formulas (may contain errors)</div>
              </div>
            </div>

            <div className={styles.artifactsBanner}>
              <div className={styles.newBadge}>NƎW</div>
              <div className={styles.artifactsText}>
                Artifæcts: Create and iterate on documents, code, and møre within Claube. <a href="#" className={styles.tryLink}>Try it øut</a>
              </div>
              <button className={styles.closeButton}>×</button>
            </div>
          </>
        )}
      </div>

      <div className={styles.avatar}>PF</div>
    </>
  )
}

export default App
