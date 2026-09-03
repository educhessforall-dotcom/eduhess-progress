-- Generated from EduChess_Curriculum_Master_Edition (3).docx
insert into public.curriculum_years (year_number, stage_name, identity) values
(1, 'Foundation', 'Rules, board vision, simple tactics, notation, basic mates and endings'),
(2, 'Early Development', 'Pattern growth, opening logic, attack basics, elementary strategy'),
(3, 'Core Competitive', 'Thinking process, candidate moves, structures, rook endings'),
(4, 'Competitive Intermediate', 'Planning, positional play, compensation, advanced practical skill'),
(5, 'Advanced Club', 'Prophylaxis, imbalances, attack vs defense, technical endings, repertoire work'),
(6, 'Academy Mastery', 'Independent training, preparation, high-level endings, capstone analysis')
on conflict (year_number) do update set stage_name=excluded.stage_name, identity=excluded.identity;

-- Year 1: Foundation
insert into public.lessons (curriculum_year_id, week_number, title, description)
select cy.id, v.week_number, v.title, v.description
from public.curriculum_years cy
cross join (values
(1, 'Board Orientation', 'Ranks, files, diagonals, square colors, and square naming.'),
(2, 'Major Pieces', 'Movement and capture of king, queen, rook; the king cannot move into check.'),
(3, 'Minor Pieces & Pawn', 'Movement of bishop, knight, and pawn, including pawn capture and knight movement.'),
(4, 'Special Rules', 'Castling, promotion, and en passant, practiced until fully clear.'),
(5, 'Check', 'Meaning of check and the three legal responses: move, block, or capture.'),
(6, 'Checkmate & Stalemate', 'The difference is clarified with comparison positions.'),
(7, 'Mate in One', 'Recognizing direct mating patterns and checking escape squares.'),
(8, 'Mini-Games', 'Reduced-material games apply movement, capture, check, and discipline.'),
(9, 'Notation', 'Writing and reading moves; introduction to score sheets.'),
(10, 'Queen Mate — Checkpoint 1', 'King and queen versus king, taught via the box method. First checkpoint.'),
(11, 'Rook Mate', 'King and rook versus king, with careful move order and coordination.'),
(12, 'Mating Review', 'Both major-piece mating techniques repeated until reliable.'),
(13, 'Forks', 'Forks by knight, pawn, queen, and king; spotting one move that attacks two targets.'),
(14, 'Pins', 'How a pinned piece loses mobility and how pins win material or stop defense.'),
(15, 'Skewers', 'Comparing skewers with pins so students can tell the difference immediately.'),
(16, 'Hanging Pieces', 'Board-scanning training to spot undefended material before every move.'),
(17, 'Discovered Attack', 'One piece moves away and reveals an attack from a piece behind it.'),
(18, 'Tactics Checkpoint', 'Mixed tactical test on all basic motifs learned so far.'),
(19, 'Opening Principles I', 'Center control and development as goals of the opening.'),
(20, 'Opening Principles II — Mid-Year Exam', 'King safety, castling, and coordination, followed by the mid-year exam.'),
(21, 'Opening Mistakes', 'Why early queen moves, repeated moves, and random pawn moves cause problems.'),
(22, 'Transition to Middlegame', 'Improving weak pieces, connecting rooks, and watching for threats.'),
(23, 'Simple Attack', 'Coordinating queen, bishop, rook, or knight in simple attacking positions.'),
(24, 'Model Game', 'A complete beginner-friendly game showing opening, tactics, and endgame together.'),
(25, 'Passed Pawns', 'Why passed pawns are dangerous and how promotion races are decided.'),
(26, 'Opposition', 'A king maneuver that controls the key route in pawn endings.'),
(27, 'Key Squares', 'Squares that decide whether a pawn can promote and the king can support it.'),
(28, 'Basic Pawn Endings', 'Practical drills reinforcing opposition, promotion races, and winning methods.'),
(29, 'Active King', 'The king becomes a fighting piece in the endgame and should not stay passive.'),
(30, 'Endgame Checkpoint 2', 'Assessment of basic pawn endings and earlier mating technique.'),
(31, 'Tournament Habits', 'Clock basics, touch-move, etiquette, board setup, and post-game behavior.'),
(32, 'Practice Game I', 'Full game played and reviewed, focusing on the first serious mistake.'),
(33, 'Practice Game II', 'Supervised game reviewing opening discipline.'),
(34, 'Practice Game III', 'Supervised game reviewing tactical chances and hanging pieces.'),
(35, 'Full-Year Review', 'Students create summary notes and revisit all major Year 1 topics.'),
(36, 'Written Review Test', 'Paper test on rules, notation, tactics, opening ideas, and simple endings.'),
(37, 'Final Practical 1', 'Demonstration of queen mate, rook mate, and notation ability.'),
(38, 'Final Practical 2', 'Demonstration of simple pawn endings and one supervised game.'),
(39, 'Correction Week', 'Weak areas reinforced before the promotion decision.'),
(40, 'Promotion Review', 'Teacher conference, parent meeting, and recommendation for Year 2.')
) as v(week_number,title,description)
where cy.year_number = 1
on conflict (curriculum_year_id, week_number) do update set title=excluded.title, description=excluded.description;

-- Year 2: Early Development
insert into public.lessons (curriculum_year_id, week_number, title, description)
select cy.id, v.week_number, v.title, v.description
from public.curriculum_years cy
cross join (values
(1, 'Double Attacks & Fork Review', 'Year 1 fork ideas revisited at a higher level, connecting piece and pawn double attacks.'),
(2, 'Discovered Attacks — Advanced', 'Deeper discovered-attack patterns, including discovered check.'),
(3, 'Double Check', 'Recognizing double check as the strongest forcing device on the board.'),
(4, 'Simple Decoys', 'Luring a piece onto a square where it becomes vulnerable.'),
(5, 'Tactical Expansion Review', 'Mixed practice combining forks, discoveries, and decoys, with the final gain explained each time.'),
(6, 'Deflection', 'Forcing a defending piece away from an important line, square, or task.'),
(7, 'Removal of the Defender', 'Capturing or eliminating a piece that guards a key square or piece.'),
(8, 'Attraction', 'Luring the enemy king or a piece onto a bad square.'),
(9, 'Clearance', 'Vacating a square or line so another piece can use it.'),
(10, 'Checkpoint 1 — Mixed Tactics Test', 'A test covering deflection, removal of the defender, attraction, and clearance.'),
(11, 'Punishing Early Queen Moves', 'Principle-based responses when an opponent brings the queen out too early.'),
(12, 'Punishing Neglected Development', 'How to exploit an opponent who ignores development.'),
(13, 'Punishing King Safety Neglect', 'How to exploit an opponent who delays castling or weakens the king.'),
(14, 'Common Opening Traps', 'Recognizing and avoiding frequent beginner opening traps.'),
(15, 'Opening Punishment — Practice Games', 'Supervised games applying principle-based opening punishment.'),
(16, 'Active versus Passive Pieces', 'Why better-placed pieces often matter more than extra moves.'),
(17, 'Open Files & Rook Placement', 'Rooks growing stronger on open files and how to fight for them.'),
(18, 'Strong & Weak Squares', 'Identifying squares that cannot be defended by pawns.'),
(19, 'Piece Quality over Material Count', 'Comparing active and passive pieces of equal material value.'),
(20, 'Mid-Year Examination', 'Combined test on tactics, opening punishment, and simple strategy.'),
(21, 'Gathering Attackers', 'Bringing enough pieces toward the enemy king before attacking.'),
(22, 'Opening Lines Toward the King', 'Breaking open files, diagonals, and ranks near the enemy king.'),
(23, 'Identifying Overworked Defenders', 'Spotting a defender guarding more than one duty at once.'),
(24, 'Combining Tactical Motifs Near the King', 'Linking multiple tactical ideas inside one attacking sequence.'),
(25, 'Attacking Practice Games', 'Supervised games focused on elementary king-side attack.'),
(26, 'King Activity in the Endgame', 'Using the king as an active fighting piece.'),
(27, 'Active Rook Play', 'Rook activity as the deciding factor in simple rook endings.'),
(28, 'Basic Rook Endings', 'Core rook-versus-pawns and rook-versus-rook technique.'),
(29, 'Converting an Extra Pawn', 'Practical technique for turning a small material edge into a win.'),
(30, 'Checkpoint 2 — Endgame Application', 'Assessment of king activity, rook play, and basic conversion.'),
(31, 'Model Game I — Opening to Middlegame', 'A complete game studied for its opening-to-middlegame transition.'),
(32, 'Model Game II — Attack Execution', 'A complete game studied for its attacking execution.'),
(33, 'Model Game III — Endgame Conversion', 'A complete game studied for its endgame conversion.'),
(34, 'Student Explanation Practice', 'Students explain turning points from studied games in their own words.'),
(35, 'Guided Game Review Workshop', 'Coach-guided review session consolidating the model-game block.'),
(36, 'Full-Year Review', 'Students revisit all major Year 2 topics and create summary notes.'),
(37, 'Final Examination — Written Paper', 'Mixed written paper on tactics, strategy, and opening punishment.'),
(38, 'Final Examination — Practical Board Test', 'Practical rook-ending and tactical demonstration.'),
(39, 'Final Examination — Game / Annotation Task', 'One student-annotated game showing clear, simple thinking.'),
(40, 'Promotion Review', 'Teacher conference, parent meeting, and recommendation for Year 3.')
) as v(week_number,title,description)
where cy.year_number = 2
on conflict (curriculum_year_id, week_number) do update set title=excluded.title, description=excluded.description;

-- Year 3: Core Competitive
insert into public.lessons (curriculum_year_id, week_number, title, description)
select cy.id, v.week_number, v.title, v.description
from public.curriculum_years cy
cross join (values
(1, 'Checks, Captures, Threats', 'The first scan of any position: forcing moves before quiet moves.'),
(2, 'Generating Candidate Moves', 'Narrowing the position down to the most promising serious options.'),
(3, 'Comparing Candidate Lines', 'Weighing short lines against each other before committing.'),
(4, 'Final Evaluation & Decision-Making', 'Turning calculation into a confident final choice.'),
(5, 'Thinking Process — Practice Positions', 'Applying the full checks-captures-threats-candidates method under supervision.'),
(6, 'Isolated Pawns', 'How an isolated pawn creates both weaknesses and dynamic chances.'),
(7, 'Doubled Pawns', 'Long-term structural effects of doubled pawns.'),
(8, 'Passed Pawns & Structure', 'Passed pawns as a structural asset, not only an endgame idea.'),
(9, 'Pawn Majorities', 'How majorities on one flank shape the middlegame plan.'),
(10, 'Checkpoint 1 — Structure Application', 'Applying structural ideas to plan selection under test conditions.'),
(11, 'Central Pawn Tension', 'Deciding when to release, maintain, or increase central tension.'),
(12, 'Structure-Based Plans', 'Turning a structural feature directly into a concrete plan.'),
(13, 'Calculating Without Moving Pieces', 'Building the discipline to calculate purely in the head.'),
(14, 'Holding Short Variations in Mind', 'Retaining a line accurately across several moves.'),
(15, 'Calculation Trees & Candidate Comparison', 'Branching calculation across more than one candidate move.'),
(16, 'Visualization Drills', 'Board-free exercises to strengthen mental visualization.'),
(17, 'Calculation Under Time Pressure', 'Keeping calculation reliable when time is limited.'),
(18, 'Calculation & Visualization Test', 'Assessment of accurate, disciplined calculation.'),
(19, 'Active Rook Principles', 'The general principles that make a rook strong in the endgame.'),
(20, 'Mid-Year Examination', 'Combined test on thinking process, structures, and calculation.'),
(21, 'King Cut-Off Technique', 'Using the rook to restrict the enemy king''s access to key files or ranks.'),
(22, 'Rook Behind the Passed Pawn', 'The rule of placing the rook behind a passed pawn, for both sides.'),
(23, 'The Lucena Position', 'The key bridge-building method for winning rook endings.'),
(24, 'The Philidor Position', 'The classical drawing method using active rook placement.'),
(25, 'Practical Rook-Ending Decision-Making', 'Applying Lucena, Philidor, and cut-off technique in mixed practical tests.'),
(26, 'Central Pawn Breaks', 'Timing a central break to open the position favorably.'),
(27, 'Opposite-Side Castling Attacks', 'Racing plans when kings castle on opposite wings.'),
(28, 'Exchanging Off Attackers', 'Removing an opponent''s key attacking pieces to defuse an attack.'),
(29, 'Defensive Regrouping', 'Repositioning pieces to hold a difficult defensive position.'),
(30, 'Checkpoint 2 — Attack & Defense', 'Assessment of central breaks, attacking play, and defensive regrouping.'),
(31, 'Attack vs Defense — Practice Games I', 'Supervised games with a clear attacker and defender.'),
(32, 'Attack vs Defense — Practice Games II', 'Continued practical games with post-game analysis.'),
(33, 'Identifying Critical Moments in Own Games', 'Learning to find the real turning point of a personal game.'),
(34, 'Spotting Missed Candidates', 'Reviewing games for candidate moves that were overlooked.'),
(35, 'Structural Misunderstandings Review', 'Correcting recurring structural misjudgments from personal games.'),
(36, 'Self-Annotation Workshop', 'Guided practice writing a full self-annotated game.'),
(37, 'Final Examination — Written Paper', 'Calculation and thinking-process paper.'),
(38, 'Final Examination — Rook-Ending Practical Test', 'Practical demonstration of Lucena, Philidor, and cut-off technique.'),
(39, 'Long Supervised Game', 'One long, fully supervised tournament-style game.'),
(40, 'Final Annotated Game & Promotion Review', 'Self-annotated tournament game plus teacher conference and parent meeting.')
) as v(week_number,title,description)
where cy.year_number = 3
on conflict (curriculum_year_id, week_number) do update set title=excluded.title, description=excluded.description;

-- Year 4: Competitive Intermediate
insert into public.lessons (curriculum_year_id, week_number, title, description)
select cy.id, v.week_number, v.title, v.description
from public.curriculum_years cy
cross join (values
(1, 'The Bishop Pair', 'Why two bishops often work better together than a bishop and a knight.'),
(2, 'Weak Squares & Color Complexes', 'Recognizing and exploiting a weak color complex.'),
(3, 'Outposts', 'Establishing and using a secure advanced outpost square.'),
(4, 'Backward Pawns', 'Identifying and attacking or defending a backward pawn.'),
(5, 'Space Advantage', 'Using extra space to restrict the opponent''s pieces.'),
(6, 'Positional Assets — Practice Test', 'Applying bishop pair, outposts, and weak squares to real positions.'),
(7, 'Initiative', 'Keeping the opponent reacting instead of making their own plans.'),
(8, 'Temporary Sacrifices', 'Sacrifices that are returned shortly for a concrete gain.'),
(9, 'Judging Compensation', 'Evaluating whether material given up is fairly repaid.'),
(10, 'Checkpoint 1 — Dynamic Play', 'Assessment of initiative, sacrifice, and compensation judgment.'),
(11, 'Practical Attack Momentum', 'Keeping an attack moving forward without losing the thread.'),
(12, 'Dynamic vs Static Factors', 'Weighing a temporary dynamic edge against a permanent static one.'),
(13, 'Improving the Worst Piece', 'Finding and upgrading the least active piece on the board.'),
(14, 'Creating Targets', 'Provoking or fixing weaknesses in the opponent''s position.'),
(15, 'Restraining Counterplay', 'Limiting the opponent''s active options while improving one''s own.'),
(16, 'Choosing the Right Transformation', 'Deciding which type of advantage to convert an edge into.'),
(17, 'Multi-Move Plan Construction', 'Building a plan that spans several connected moves.'),
(18, 'Planning Test', 'Assessment of plan construction and piece improvement.'),
(19, 'Queen Endings I', 'Basic queen-ending principles: checks, perpetual check, and king safety.'),
(20, 'Mid-Year Examination', 'Combined test on positional assets, dynamic play, and planning.'),
(21, 'Queen Endings II', 'Practical queen-ending technique and common winning methods.'),
(22, 'Difficult Rook Endings', 'Rook endings beyond Lucena and Philidor, with unequal pawns.'),
(23, 'Passed-Pawn Technique', 'Advanced handling of passed pawns in complex endings.'),
(24, 'Fortress Ideas in Practice', 'Recognizing and building a fortress under pressure.'),
(25, 'Advanced Endgame — Practical Test', 'Assessment of queen, rook, and fortress endgame technique.'),
(26, 'Time Management', 'Practical clock discipline across different game phases.'),
(27, 'Practical Decision-Making', 'Choosing a good-enough move under real tournament conditions.'),
(28, 'Defending Worse Positions', 'Practical resilience and resourcefulness when objectively worse.'),
(29, 'Emotional Recovery After Mistakes', 'Staying focused and objective after a blunder.'),
(30, 'Checkpoint 2 — Practical Play', 'Assessment of time management and practical decision-making.'),
(31, 'Tournament Simulation Game', 'A full game played under realistic tournament conditions.'),
(32, 'Blockade Theme', 'Stopping a passed pawn or pawn chain with a well-placed blockading piece.'),
(33, 'Minority Attack Theme', 'Creating a target with fewer pawns on one flank.'),
(34, 'Weak Color Complex Theme', 'A full game built around exploiting one color of squares.'),
(35, 'Passed-Pawn Race Theme', 'Calculating and judging races between passed pawns.'),
(36, 'Thematic Games Review', 'Consolidating blockade, minority attack, and structural themes.'),
(37, 'Final Examination — Written Paper', 'Strategic diagnosis and written planning answers.'),
(38, 'Final Examination — Advanced Endgame Task', 'Practical demonstration of advanced endgame technique.'),
(39, 'Serious Training Game', 'One fully supervised, competitively played training game.'),
(40, 'Oral Plan Explanation & Promotion Review', 'Oral defense of a chosen plan; teacher conference and parent meeting.')
) as v(week_number,title,description)
where cy.year_number = 4
on conflict (curriculum_year_id, week_number) do update set title=excluded.title, description=excluded.description;

-- Year 5: Advanced Club
insert into public.lessons (curriculum_year_id, week_number, title, description)
select cy.id, v.week_number, v.title, v.description
from public.curriculum_years cy
cross join (values
(1, 'Identifying the Opponent''s Plan', 'The core prophylactic question: what does the opponent want to do next?'),
(2, 'Quiet Preventive Moves', 'Moves that prevent an idea without committing to a plan of one''s own.'),
(3, 'Restricting Counterplay', 'Reducing the opponent''s active options before pursuing an advantage.'),
(4, 'Prophylactic Thinking in Practice', 'Combining prophylaxis with a concrete plan of one''s own.'),
(5, 'Prophylaxis — Practice Positions', 'Applying prophylactic thinking under supervised test conditions.'),
(6, 'Justified Sacrifices', 'Judging when a material sacrifice is objectively sound.'),
(7, 'Defensive Resources', 'Finding hidden resources in a difficult defensive position.'),
(8, 'Returning Material for Safety', 'Giving back material to reach a safe, defensible position.'),
(9, 'Practical Balance in Sharp Positions', 'Balancing risk and safety in double-edged positions.'),
(10, 'Checkpoint 1 — Attack vs Defense', 'Assessment of sacrifice judgment and defensive resourcefulness.'),
(11, 'Attack vs Defense — Practice Games', 'Supervised games with attacker and defender roles assigned.'),
(12, 'Bishop versus Knight', 'Judging which minor piece favors a given position.'),
(13, 'Pawn Majorities as Imbalance', 'Using a pawn majority as the basis for a long-term plan.'),
(14, 'Weak Color Complexes', 'Building a plan around a lasting weak color complex.'),
(15, 'Static versus Dynamic Edges', 'Weighing a permanent advantage against a temporary one.'),
(16, 'Choosing the Key Imbalance', 'Identifying which imbalance matters most in a given position.'),
(17, 'Imbalance-Based Planning', 'Turning the key imbalance into a coherent multi-move plan.'),
(18, 'Strategic Imbalance Test', 'Assessment of imbalance recognition and plan selection.'),
(19, 'Comparing Imperfect Lines', 'Choosing between lines when no option is fully satisfying.'),
(20, 'Mid-Year Examination', 'Combined test on prophylaxis, attack versus defense, and imbalances.'),
(21, 'Balancing Concrete & Positional Judgment', 'Combining calculation with general positional understanding.'),
(22, 'Calculation Under Uncertainty', 'Calculating confidently when the position resists clear evaluation.'),
(23, 'Practical Decision Trees', 'Structuring a decision between several unclear candidate moves.'),
(24, 'Unclear-Position Practice Test', 'Assessment of judgment in objectively unclear positions.'),
(25, 'Fortresses', 'Recognizing and constructing a fortress that resists material advantage.'),
(26, 'Outside Passed Pawns', 'Using an outside passer as a long-term winning resource.'),
(27, 'Difficult Rook Endings', 'Advanced rook-ending technique beyond the basic methods.'),
(28, 'Saving Methods in Worse Positions', 'Practical defensive resources for objectively worse endings.'),
(29, 'Checkpoint 2 — Technical Endings', 'Assessment of fortress, outside-passer, and rook-ending technique.'),
(30, 'Defensive Practical Test', 'A practical test focused entirely on defending a worse position.'),
(31, 'Building an Opening File', 'Starting a structured personal repertoire file.'),
(32, 'Structures Behind the Repertoire', 'Understanding the typical structures the repertoire leads to.'),
(33, 'Typical Middlegames from the Repertoire', 'Studying the middlegame plans that follow the chosen openings.'),
(34, 'Repertoire Practice Games', 'Games played directly from the student''s own repertoire.'),
(35, 'Repertoire Review', 'Reviewing and refining the personal opening file.'),
(36, 'Full-Year Review', 'Revisiting prophylaxis, imbalances, and technical endings from the year.'),
(37, 'Final Examination — Advanced Mixed Paper', 'A mixed paper spanning the year''s major themes.'),
(38, 'Classical Game Review', 'Structured review of one classical game with a clear strategic theme.'),
(39, 'Defended-Worse-Position Task', 'One practical task focused on saving a difficult position.'),
(40, 'Self-Annotated Practical Game & Promotion Review', 'A fully self-annotated game plus teacher conference and parent meeting.')
) as v(week_number,title,description)
where cy.year_number = 5
on conflict (curriculum_year_id, week_number) do update set title=excluded.title, description=excluded.description;

-- Year 6: Academy Mastery
insert into public.lessons (curriculum_year_id, week_number, title, description)
select cy.id, v.week_number, v.title, v.description
from public.curriculum_years cy
cross join (values
(1, 'Converting Space into Attack', 'Turning a space advantage into a concrete kingside or queenside attack.'),
(2, 'Converting Initiative into Material', 'Cashing in a lasting initiative for a tangible material gain.'),
(3, 'Simplifying Without Losing Control', 'Trading pieces while preserving the essence of an advantage.'),
(4, 'Intensifying an Advantage', 'Building on an edge instead of releasing the tension too early.'),
(5, 'Transformation — Practice Positions', 'Applying transformation of advantage to varied practical positions.'),
(6, 'Transformation Test', 'Assessment of converting one type of advantage into another.'),
(7, 'Identifying Critical Moments', 'Recognizing the single most important decision point in a game.'),
(8, 'Forcing-Line Depth', 'Calculating forcing sequences to a full, concrete conclusion.'),
(9, 'Disciplined Comparison of Multiple Lines', 'Comparing several deep candidate lines methodically.'),
(10, 'Checkpoint 1 — Advanced Calculation', 'Assessment of critical-moment recognition and forcing-line calculation.'),
(11, 'Calculation Under Complexity', 'Maintaining calculation accuracy in highly complex positions.'),
(12, 'Calculation Practice Set', 'A concentrated set of advanced calculation exercises.'),
(13, 'Locked Centers', 'Planning on both wings when the center is closed.'),
(14, 'Hanging Pawns', 'The dynamic strengths and long-term weaknesses of hanging pawns.'),
(15, 'Isolani Transformations', 'How an isolated queen''s pawn structure changes through the game.'),
(16, 'Minority Attacks Revisited', 'Advanced minority-attack technique and typical counterplay against it.'),
(17, 'Structure-Based Planning', 'Building a full plan from an advanced structural feature.'),
(18, 'Structure Battle Test', 'Assessment of advanced pawn-structure understanding.'),
(19, 'Building a Preparation File', 'Creating a structured personal file of openings, plans, and structures.'),
(20, 'Mid-Year Examination', 'Combined test on transformation, calculation, and structure battles.'),
(21, 'Move-Order Nuances', 'How move-order differences can allow or prevent key options.'),
(22, 'Preparing Transpositions', 'Anticipating and steering the game toward favorable transpositions.'),
(23, 'Typical Middlegames from Preparation', 'Studying the middlegame types that follow the prepared openings.'),
(24, 'Preparation — Practice Test', 'Assessment of opening-preparation quality and move-order awareness.'),
(25, 'Queen Endings', 'Advanced queen-ending technique at a mastery level.'),
(26, 'Technical Rook Endings', 'Precise technical handling of demanding rook endings.'),
(27, 'Fortresses Revisited', 'Advanced fortress construction and recognition.'),
(28, 'Difficult Drawing Methods', 'Saving technically lost-looking positions through precise defense.'),
(29, 'Checkpoint 2 — High-Level Endings', 'Assessment of queen, rook, and fortress endgame mastery.'),
(30, 'Endgame Practical Test', 'A comprehensive practical test across high-level endgame themes.'),
(31, 'Preparing for a Specific Opponent', 'Building opponent-specific preparation for an upcoming game.'),
(32, 'Long Game Practice I', 'A full-length game played under serious tournament conditions.'),
(33, 'Long Game Practice II', 'A second full-length game with a different opening or structure.'),
(34, 'Structured Post-Mortem Analysis', 'A disciplined post-mortem beginning with the players'' own thoughts.'),
(35, 'Tournament Simulation Review', 'Reviewing the simulation block and identifying preparation gaps.'),
(36, 'Portfolio Compilation', 'Assembling the graduation portfolio of games, notes, and preparation files.'),
(37, 'Final Written Examination', 'The advanced mixed paper covering the full year''s themes.'),
(38, 'Long Practical Game', 'One long, fully supervised graduation-level game.'),
(39, 'Oral Defense of Plan & Preparation', 'Oral defense of a chosen plan and the preparation behind it.'),
(40, 'Graduation Review & Future Training Planning', 'Portfolio completion, final review, and planning for future training.')
) as v(week_number,title,description)
where cy.year_number = 6
on conflict (curriculum_year_id, week_number) do update set title=excluded.title, description=excluded.description;
