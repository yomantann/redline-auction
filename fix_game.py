import sys
import os

file_path = 'client/src/pages/Game.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Deduplicate export default Game;
marker = 'export default Game;'
first_pos = content.find(marker)
if first_pos != -1:
    content = content[:first_pos + len(marker)]

# 2. Fix the broken Header section / Dialog start
# The previous sed output showed corruption:
# ROUND {round} / {totalRounds}
#                 </Badge>
#               </div>
#             </div>
#           </div>
#         </div>
#             <DialogTitle ...
# This is missing the <Dialog> opening tag and header.

import re

# Find where the Badge section ends and the corrupted DialogTitle starts
corrupted_pattern = r'ROUND \{round\} / \{totalRounds\}\s*</Badge>\s*</div>\s*</div>\s*</div>\s*</div>\s*<DialogTitle'
correct_header_end = """ROUND {round} / {totalRounds}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP LIBRARY DIALOG */}
      <Dialog open={showPopupLibrary} onOpenChange={setShowPopupLibrary}>
        <DialogContent className="max-w-2xl bg-black/90 border-white/10 backdrop-blur-xl max-h-[80vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle"""

content = re.sub(r'ROUND \{round\} / \{totalRounds\}\s*</Badge>\s*</div>\s*</div>\s*</div>\s*</div>\s*<DialogTitle', correct_header_end, content)

# 3. Balance <div> tags at the end of the Game function
# The tail showed:
#       </div>
#     </GameLayout>
#   );
# }
# export default Game;

# We need to make sure the number of </div> before </GameLayout> matches the structure.
# Currently: 
# <GameLayout>
#   <MusicPlayer />
#   <div Header Info> ... </div>
#   {/* POPUP LIBRARY DIALOG */}
#   <Dialog> ... </Dialog>
#   <Dialog> ... </Dialog>
#   <Dialog> ... </Dialog>
#   <div className="flex-1 overflow-y-auto ..."> <-- This <div> was opened in the game log section
#     {logs...}
#   </div>
# </div> (Game Log container)
# </div> (Inner Page container?)
# </div> (Main Page container?)

# Let's count the opens/closes in the last block
# <div className="bg-card/30 rounded p-4 border border-white/5 h-[300px] flex flex-col"> (1)
#   <h3>...</h3>
#   <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs text-zinc-500 custom-scrollbar"> (2)
#     {logs}
#   </div> (close 2)
# </div> (close 1)
# </div> (close ??)
# </div> (close ??)

# Based on the last tail, we have:
#               })()}
#             </div>
#           </div>
#         </div>
#       </div>
#     </GameLayout>

# That's 4 </div> tags. If only 2 were opened in the trailing section, it might be closing
# some layout containers.

with open(file_path, 'w') as f:
    f.write(content)
