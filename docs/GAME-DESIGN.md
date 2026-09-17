# Bottles Up! — first playable release

The core decision is how much work to release onto the line. A bigger dump can build Full Flow quickly, but it also creates congestion and makes inspection harder. The player manages three things at once: supply, standing speed, and quality.

## Shift structure

A competitive shift lasts three minutes or until twelve bottles are lost. Endless uses the same waste limit without a timer. Practice removes the game-over pressure. Each juice begins with two bins of 32 bottles; later levels increase bin size, the required bins, and the fixed long-belt speed. Clearing every bottle from the required bins advances the juice.

Mighty Dozen → Celery + Lemon → Citrus Pineapple → Berry Lemon → repeat at increasing difficulty. These are game colors and names inspired by the supplied product photo, not a representation of production specifications.

## Scoring and pressure

| Event | Points / effect |
| --- | --- |
| Stand a new bottle | 10 × combo multiplier, up to ×4 |
| Stand it again after it tips | 2; cannot farm the full award |
| Good upright bottle reaches machine | 8 |
| Reject a defective bottle | 30 |
| Reject a good bottle | −25; combo resets |
| Defective bottle reaches machine | −60 and one waste |
| Fallen bottle jams at machine or spills from entry | −35 and one waste |
| 34 good bottles standing at once | +300, then ten seconds of ×3 positive action/exit points |
| Complete a juice | +300 |

Quick clean handling maintains the combo; a gap longer than 2.5 seconds resets it. Labels, caps, and fill are modeled defects, with a combined 10% chance. Five percent of bottles are finicky and may fall once after standing. Full Flow only counts good upright bottles; it rearms after the bonus ends and the standing population drops below 22.

The long belt always runs except during a stop bonus/card or a paused game. Fallen bottles occupy more space than upright bottles. A crowded transfer builds pressure and spills bottles; bottles left down at the machine jam briefly before counting as waste. The short belt stops when its slider reaches zero, so the player can regulate supply while catching up downstream.

## Mystery rewards

Every 18 new handling actions earns a purple bonus box. There is one unopened reward at a time. It can grant an eight-second stop, a 25-second helper, 250 points, a seven-second stop card, or an 18-second quality sweep. Up to four temporary helpers work automatically; their work contributes to the player's score. The quality sweep catches one defect per second. Every run starts with one stop card.

## Competition

Ordinary shifts use a shared daily UTC seed. Host challenges use their own fixed seed so participants receive the same random sequence under the same actions. Mode and version travel with each result. Runs are immutable and saves retry using the same unique run ID. Practice is excluded. Hosts can lock challenge submissions, and Sean can exclude suspect runs.

The simulation runs locally in the browser. Database rules check ownership and sensible result bounds; they cannot prove that a score was earned legitimately. Server-side replay validation and verified accounts would be separate work for stronger tournament integrity.

## Scope of this release

The crew are simplified modeled characters in white smocks, hearing protection, hairnets, boots, and gloves; selected characters have beard nets. Helpers are AI bonuses, not simultaneous networked players. The introductory cutscene is a short in-engine camera sweep. Music and effects are original Web Audio synthesis. Collision and congestion use deterministic arcade spacing, not rigid-body physics.

Blender and Unreal are not required or connected. Editable GLBs provide a starting point for replacing the bottle/crew models with richer assets later. The included generated key art is promotional artwork; the realtime game has a simpler 3D visual style.
