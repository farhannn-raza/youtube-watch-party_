import React, { useState } from "react";
import "./ParticipantList.css";

const ROLE_LABELS = { host: "Host", moderator: "Mod", participant: "Viewer" };

export default function ParticipantList({
  participants,
  mySocketId,
  isHost,
  onAssignRole,
  onRemoveParticipant,
}) {
  const [openMenu, setOpenMenu] = useState(null);

  const handleAssign = (userId, role) => {
    onAssignRole(userId, role);
    setOpenMenu(null);
  };

  const handleRemove = (userId) => {
    onRemoveParticipant(userId);
    setOpenMenu(null);
  };

  return (
    <div className="plist">
      <div className="plist__header">
        <span className="plist__title">Participants</span>
        <span className="plist__count">{participants.length}</span>
      </div>

      <ul className="plist__items">
        {participants.map((p) => (
          <li key={p.socketId} className="plist__item fade-in">
            <div className="plist__info">
              <span className="plist__name">
                {p.username}
                {p.socketId === mySocketId && <span className="plist__you"> (you)</span>}
              </span>
              <span className={`tag tag--${p.role}`}>{ROLE_LABELS[p.role] || p.role}</span>
            </div>

            {/* Host actions — only for other participants */}
            {isHost && p.socketId !== mySocketId && (
              <div className="plist__actions">
                <button
                  className="plist__action-btn"
                  onClick={() => setOpenMenu(openMenu === p.socketId ? null : p.socketId)}
                  title="Manage"
                >
                  ⋯
                </button>

                {openMenu === p.socketId && (
                  <div className="plist__menu">
                    {p.role !== "moderator" && (
                      <button onClick={() => handleAssign(p.socketId, "moderator")}>
                        → Make Moderator
                      </button>
                    )}
                    {p.role !== "participant" && (
                      <button onClick={() => handleAssign(p.socketId, "participant")}>
                        → Make Participant
                      </button>
                    )}
                    <button onClick={() => handleAssign(p.socketId, "host")}>
                      → Transfer Host
                    </button>
                    <button className="danger" onClick={() => handleRemove(p.socketId)}>
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
