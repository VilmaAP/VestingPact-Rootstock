export default function VestingProgress({ cliffEnd, vestingEnd, startTime }) {
  const now = Math.floor(Date.now() / 1000);
  const totalDuration = vestingEnd - startTime;
  const elapsed = Math.max(0, now - startTime);
  const progress = totalDuration > 0 ? Math.min(100, (elapsed / totalDuration) * 100) : 0;
  const cliffProgress = totalDuration > 0 ? ((cliffEnd - startTime) / totalDuration) * 100 : 0;
  const cliffPassed = now >= cliffEnd;

  const timeLeft = Math.max(0, vestingEnd - now);
  const daysLeft = Math.floor(timeLeft / 86400);
  const hoursLeft = Math.floor((timeLeft % 86400) / 3600);
  const minsLeft = Math.floor((timeLeft % 3600) / 60);

  let timeLeftText;
  if (timeLeft === 0) {
    timeLeftText = "Vesting completado";
  } else if (daysLeft > 0) {
    timeLeftText = `${daysLeft}d ${hoursLeft}h restantes`;
  } else if (hoursLeft > 0) {
    timeLeftText = `${hoursLeft}h ${minsLeft}m restantes`;
  } else {
    timeLeftText = `${minsLeft}m restantes`;
  }

  return (
    <div className="vesting-progress">
      <div className="progress-header">
        <span className="progress-label">Progreso del Vesting</span>
        <span className="progress-percent">{progress.toFixed(1)}%</span>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        <div
          className={`cliff-marker ${cliffPassed ? "cliff-passed" : ""}`}
          style={{ left: `${cliffProgress}%` }}
          title={`Cliff ${cliffPassed ? "completado" : "pendiente"}`}
        >
          <span className="cliff-label">Cliff</span>
        </div>
      </div>
      <div className="progress-footer">
        <span className="progress-time">{timeLeftText}</span>
        <span className={`cliff-status ${cliffPassed ? "passed" : "pending"}`}>
          {cliffPassed ? "Cliff completado" : "Cliff pendiente"}
        </span>
      </div>
    </div>
  );
}
