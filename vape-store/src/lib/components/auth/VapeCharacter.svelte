<script lang="ts">
	let {
		focusedInput = 'none',
		showPassword = false
	} = $props<{
		focusedInput?: 'none' | 'username' | 'password';
		showPassword?: boolean;
	}>();

	let manualPuff = $state(false);

	function triggerPuff() {
		manualPuff = true;
		setTimeout(() => {
			manualPuff = false;
		}, 3200);
	}
</script>

<div
	class="relative w-full max-w-[430px] aspect-square mx-auto flex items-center justify-center select-none cursor-pointer group"
	onclick={triggerPuff}
	title="Klik karakter untuk memicu hisapan & hembusan asap vape!"
>
	<!-- Ambient Neon Glow Behind Character -->
	<div class="absolute inset-2 rounded-full bg-gradient-to-tr from-emerald-500/20 via-cyan-500/15 to-transparent blur-3xl pointer-events-none animate-pulse"></div>

	<!-- Main SVG Scene -->
	<svg
		viewBox="0 0 500 500"
		class="w-full h-full drop-shadow-2xl overflow-visible"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<defs>
			<!-- Neon Border & Accent Gradients -->
			<linearGradient id="neonRing" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#10b981" />
				<stop offset="50%" stop-color="#06b6d4" />
				<stop offset="100%" stop-color="#3b82f6" />
			</linearGradient>

			<linearGradient id="hoodieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#1e293b" />
				<stop offset="50%" stop-color="#131d33" />
				<stop offset="100%" stop-color="#0b1120" />
			</linearGradient>

			<linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" stop-color="#fed7aa" />
				<stop offset="100%" stop-color="#fba874" />
			</linearGradient>

			<linearGradient id="vapePodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#06b6d4" />
				<stop offset="25%" stop-color="#0f172a" />
				<stop offset="100%" stop-color="#020617" />
			</linearGradient>

			<linearGradient id="beanieGrad" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" stop-color="#090d16" />
				<stop offset="100%" stop-color="#1e293b" />
			</linearGradient>

			<!-- Translucent Dense Vapor Cloud Gradients -->
			<radialGradient id="vaporCloud1" cx="35%" cy="35%" r="65%">
				<stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
				<stop offset="35%" stop-color="#a7f3d0" stop-opacity="0.7" />
				<stop offset="70%" stop-color="#67e8f9" stop-opacity="0.35" />
				<stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
			</radialGradient>

			<radialGradient id="vaporCloud2" cx="30%" cy="30%" r="70%">
				<stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
				<stop offset="45%" stop-color="#6ee7b7" stop-opacity="0.5" />
				<stop offset="80%" stop-color="#06b6d4" stop-opacity="0.2" />
				<stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
			</radialGradient>

			<filter id="smokeBlur" x="-30%" y="-30%" width="160%" height="160%">
				<feGaussianBlur stdDeviation="7" />
			</filter>

			<filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
				<feGaussianBlur stdDeviation="5" result="blur" />
				<feMerge>
					<feMergeNode in="blur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		</defs>

		<!-- BACKGROUND CIRCLE / NEON PORTAL -->
		<circle cx="250" cy="250" r="185" fill="#0b1324" stroke="url(#neonRing)" stroke-width="2.5" stroke-dasharray="8 6" class="opacity-75" />
		<circle cx="250" cy="250" r="172" fill="#070c18" />

		<!-- Ambient floating neon particles -->
		<circle cx="120" cy="180" r="3" fill="#10b981" class="animate-ping opacity-60" style="animation-duration: 3.5s;" />
		<circle cx="375" cy="145" r="2.5" fill="#06b6d4" class="animate-ping opacity-60" style="animation-duration: 4.2s; animation-delay: 1.5s;" />
		<circle cx="135" cy="320" r="2" fill="#10b981" class="animate-ping opacity-40" style="animation-duration: 2.8s;" />

		<!-- =========================================================================
		     STATIC TORSO & SHOULDERS (BAHU 100% DIAM / TIDAK TERANGKAT)
		========================================================================= -->
		<g class="character-torso">
			<!-- Main Torso with both shoulders completely anchored and symmetric -->
			<path
				d="M 115 450 C 120 360 170 328 250 328 C 330 328 380 360 385 450 L 385 475 L 115 475 Z"
				fill="url(#hoodieGrad)"
				stroke="#1e293b"
				stroke-width="3"
			/>

			<!-- Left Arm (Resting naturally on the left side) -->
			<path
				d="M 128 385 Q 118 435 130 465"
				stroke="#131d33"
				stroke-width="30"
				stroke-linecap="round"
			/>

			<!-- RIGHT UPPER ARM (STATIONARY - ANCHORED AT SHOULDER x:366, y:372) -->
			<!-- Bahu kanan & lengan atas dekat bahu 100% diam dan kokoh, posisi tetap tidak ikut terangkat -->
			<path
				d="M 366 372 C 374 388 374 402 360 415"
				stroke="#1e293b"
				stroke-width="30"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M 366 372 C 374 388 374 402 360 415"
				stroke="#131d33"
				stroke-width="26"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>

			<!-- Shoulder seam / deltoid crease (Aksen sambungan bahu yang realistis & anatomis) -->
			<path
				d="M 342 355 C 358 365 368 378 368 395"
				fill="none"
				stroke="#090d16"
				stroke-width="2"
				opacity="0.5"
			/>

			<!-- Hoodie Center Zipper -->
			<path d="M 250 340 L 250 475" stroke="#090d16" stroke-width="3.5" stroke-linecap="round" />

			<!-- Hoodie Collar / V-Neck contour -->
			<path d="M 215 328 C 235 355 265 355 285 328" fill="none" stroke="#334155" stroke-width="3.5" />
			
			<!-- Neon Hoodie Drawstrings -->
			<path d="M 232 345 Q 230 380 226 405" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" />
			<path d="M 268 345 Q 270 380 274 405" stroke="#06b6d4" stroke-width="2.5" stroke-linecap="round" />
			<circle cx="226" cy="407" r="3" fill="#10b981" />
			<circle cx="274" cy="407" r="3" fill="#06b6d4" />

			<!-- SS VAPE Official Badge on Chest -->
			<rect x="155" y="375" width="48" height="20" rx="6" fill="#090d16" stroke="#10b981" stroke-width="1.5" />
			<text x="179" y="389" fill="#10b981" font-size="8.5" font-family="monospace" font-weight="bold" text-anchor="middle">SS VAPE</text>
		</g>

		<!-- NECK (Properly proportioned) -->
		<path d="M 226 270 L 226 332 C 238 338 262 338 274 332 L 274 270 Z" fill="url(#skinGrad)" />
		<ellipse cx="250" cy="285" rx="22" ry="7" fill="#ea580c" opacity="0.25" />

		<!-- HEAD & FACE GROUP (Subtly tilts during vaping) -->
		<g class="character-head">
			<!-- Ears -->
			<circle cx="196" cy="228" r="11" fill="#fba874" />
			<circle cx="196" cy="228" r="6" fill="#ea580c" opacity="0.3" />
			<circle cx="192" cy="235" r="3.5" fill="none" stroke="#06b6d4" stroke-width="1.5" />

			<circle cx="304" cy="228" r="11" fill="#fba874" />
			<circle cx="304" cy="228" r="6" fill="#ea580c" opacity="0.3" />

			<!-- Face Contour -->
			<path
				d="M 200 205 C 200 155 300 155 300 205 C 300 255 280 282 250 282 C 220 282 200 255 200 205 Z"
				fill="url(#skinGrad)"
			/>

			<!-- Nose -->
			<path d="M 248 226 Q 253 238 247 241" fill="none" stroke="#ea580c" stroke-width="2.5" stroke-linecap="round" />

			<!-- MOUTH (Coordinates: cx=250, cy=259) -->
			<!-- Default Smile (Visible when not vaping) -->
			<path
				class="mouth-smile"
				d="M 240 258 Q 250 265 260 258"
				fill="none"
				stroke="#9a3412"
				stroke-width="3"
				stroke-linecap="round"
			/>
			<!-- Open "O" Mouth (Visible when blowing vapor) -->
			<ellipse
				class="mouth-vape"
				cx="250"
				cy="259"
				rx="5"
				ry="6"
				fill="#7c2d12"
				stroke="#431407"
				stroke-width="1.5"
			/>

			<!-- EYES & EXPRESSIONS -->
			<g class="eyes-normal {focusedInput === 'password' && !showPassword ? 'hidden' : ''}">
				<ellipse cx="227" cy="216" rx="8" ry="7" fill="#ffffff" />
				<circle
					cx={focusedInput === 'username' ? 230 : 227}
					cy="216"
					r="3.8"
					fill="#090d16"
					class="transition-all duration-200"
				/>
				<circle cx={focusedInput === 'username' ? 231.5 : 228.5} cy="214.5" r="1.5" fill="#ffffff" />

				<ellipse cx="273" cy="216" rx="8" ry="7" fill="#ffffff" />
				<circle
					cx={focusedInput === 'username' ? 276 : 273}
					cy="216"
					r="3.8"
					fill="#090d16"
					class="transition-all duration-200"
				/>
				<circle cx={focusedInput === 'username' ? 277.5 : 274.5} cy="214.5" r="1.5" fill="#ffffff" />

				<path d="M 218 204 Q 227 199 236 204" fill="none" stroke="#451a03" stroke-width="2.8" stroke-linecap="round" />
				<path d="M 264 204 Q 273 199 282 204" fill="none" stroke="#451a03" stroke-width="2.8" stroke-linecap="round" />
			</g>

			<!-- Inhaling / Eyes Closed with Satisfaction -->
			<g class="eyes-vaping-inhale">
				<path d="M 219 217 Q 227 222 235 217" fill="none" stroke="#451a03" stroke-width="3" stroke-linecap="round" />
				<path d="M 265 217 Q 273 222 281 217" fill="none" stroke="#451a03" stroke-width="3" stroke-linecap="round" />
			</g>

			<!-- Password Mode: Cool Cyber Sunglasses -->
			{#if focusedInput === 'password' && !showPassword}
				<g class="character-shades animate-slide-down">
					<path
						d="M 208 208 Q 250 202 292 208 L 288 230 Q 274 236 260 230 L 250 216 L 240 230 Q 226 236 212 230 Z"
						fill="#020617"
						stroke="#06b6d4"
						stroke-width="2.5"
						filter="url(#neonGlow)"
					/>
					<line x1="216" y1="212" x2="227" y2="228" stroke="#ffffff" stroke-width="1.8" opacity="0.6" stroke-linecap="round" />
					<line x1="265" y1="212" x2="276" y2="228" stroke="#ffffff" stroke-width="1.8" opacity="0.6" stroke-linecap="round" />
				</g>
			{/if}

			<!-- BEANIE / STREETWEAR CAP -->
			<g class="character-beanie">
				<path
					d="M 194 195 C 194 125 306 125 306 195 C 306 200 194 200 194 195 Z"
					fill="url(#beanieGrad)"
					stroke="#1e293b"
					stroke-width="2"
				/>
				<rect x="186" y="182" width="128" height="24" rx="9" fill="#131d33" stroke="#334155" stroke-width="2" />
				<line x1="210" y1="184" x2="210" y2="204" stroke="#090d16" stroke-width="1.8" opacity="0.5" />
				<line x1="230" y1="184" x2="230" y2="204" stroke="#090d16" stroke-width="1.8" opacity="0.5" />
				<line x1="270" y1="184" x2="270" y2="204" stroke="#090d16" stroke-width="1.8" opacity="0.5" />
				<line x1="290" y1="184" x2="290" y2="204" stroke="#090d16" stroke-width="1.8" opacity="0.5" />
				<circle cx="250" cy="194" r="7" fill="#090d16" stroke="#10b981" stroke-width="1.5" />
				<path d="M 247 196 C 247 193 253 193 253 196" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" />
			</g>
		</g>

		<!-- =========================================================================
		     REALISTIC ARTICULATED FOREARM + VAPE ASSEMBLY
		     - PIVOT EKSKLUSIF DI SIKU x:360, y:415
		     - BAHU DI x:365, y:370 100% DIAM (TIDAK TERANGKAT SAMA SEKALI)
		     - Vaping pose (0deg): Ujung pod pas di bibir (250, 259)
		     - Rest pose (-44deg): Lengan bawah rileks di depan perut/dada bawah
		========================================================================= -->
		<g class="vaping-forearm-hinge">
			<!-- Elbow Joint Cap (Seamless socket covering elbow pivot at 360, 415) -->
			<circle cx="360" cy="415" r="16" fill="#1e293b" />
			<circle cx="360" cy="415" r="13" fill="#131d33" />

			<!-- Forearm Sleeve (from elbow 360, 415 towards wrist 280, 310) -->
			<path
				d="M 360 415 L 280 310"
				stroke="#1e293b"
				stroke-width="26"
				stroke-linecap="round"
			/>
			<path
				d="M 360 415 L 280 310"
				stroke="#17223b"
				stroke-width="22"
				stroke-linecap="round"
			/>

			<!-- Wrist Cuff Rim -->
			<ellipse
				cx="280"
				cy="310"
				rx="10"
				ry="13"
				fill="#131d33"
				stroke="#334155"
				stroke-width="2"
				transform="rotate(37 280 310)"
			/>

			<!-- Hand Holding the Vape Pod -->
			<g class="hand-vape-group">
				<!-- Wrist skin joint -->
				<ellipse cx="274" cy="303" rx="8" ry="7" fill="#fba874" />

				<!-- Fingers wrapped around pod -->
				<path d="M 276 292 Q 266 288 261 294" stroke="#fed7aa" stroke-width="5" stroke-linecap="round" />
				<path d="M 277 299 Q 267 295 263 301" stroke="#fed7aa" stroke-width="5" stroke-linecap="round" />
				<path d="M 278 306 Q 268 302 265 308" stroke="#fed7aa" stroke-width="5" stroke-linecap="round" />

				<!-- Thumb -->
				<path d="M 268 288 Q 260 286 256 290" stroke="#fba874" stroke-width="4.5" stroke-linecap="round" />

				<!-- VAPE POD DEVICE -->
				<!-- Pod Body (angled directly at mouth 250, 259) -->
				<rect
					x="253"
					y="266"
					width="15"
					height="40"
					rx="5"
					fill="url(#vapePodGrad)"
					stroke="#06b6d4"
					stroke-width="1.4"
					transform="rotate(-26 261 280)"
				/>

				<!-- Transparent Pod Cartridge / Drip Tip (Touches lips cx: 250, cy: 259) -->
				<path
					d="M 253 266 L 253 259 C 253 256 263 256 263 259 L 263 266 Z"
					fill="#38bdf8"
					opacity="0.9"
					stroke="#0284c7"
					stroke-width="1"
					transform="rotate(-26 261 280)"
				/>

				<!-- Firing Button -->
				<circle cx="264" cy="279" r="3" fill="#0f172a" stroke="#10b981" stroke-width="1" />

				<!-- NEON LED GLOW ON POD (Lights up bright cyan when at lips) -->
				<circle
					class="vape-led-glow"
					cx="267"
					cy="291"
					r="3.5"
					fill="#10b981"
					filter="url(#neonGlow)"
				/>
			</g>
		</g>

		<!-- =========================================================================
		     ANIMATED VAPOR SMOKE CLOUDS ("ASAP VAPE MEMBUMBUNG DARI MULUT")
		     Mouth position: cx=250, cy=259
		========================================================================= -->
		<g class="smoke-container">
			<!-- Puff 1: Dense initial puff right out of the mouth -->
			<path
				class="vape-smoke-puff-1"
				d="M 252 258 C 235 235 235 195 272 188 C 310 180 338 215 325 245 C 315 265 278 270 252 258 Z"
				fill="url(#vaporCloud1)"
				filter="url(#smokeBlur)"
			/>

			<!-- Puff 2: Swirling secondary cloud billowing to the right -->
			<path
				class="vape-smoke-puff-2"
				d="M 255 256 C 280 235 325 235 352 205 C 378 175 358 135 315 140 C 275 145 248 185 255 256 Z"
				fill="url(#vaporCloud2)"
				filter="url(#smokeBlur)"
			/>

			<!-- Puff 3: Huge swirling vape smoke ring drifting upwards -->
			<g class="vape-smoke-ring" filter="url(#smokeBlur)">
				<ellipse cx="325" cy="165" rx="38" ry="24" fill="none" stroke="url(#vaporCloud1)" stroke-width="18" opacity="0.85" />
			</g>

			<!-- Floating Ambient Vapor Trails -->
			<path
				class="vape-smoke-trail"
				d="M 250 259 Q 290 225 330 195 T 385 125"
				fill="none"
				stroke="url(#vaporCloud1)"
				stroke-width="12"
				stroke-linecap="round"
				filter="url(#smokeBlur)"
			/>
		</g>

		<!-- BOTTOM BANNER / INTERACTIVE HINT -->
		<g class="opacity-75 group-hover:opacity-100 transition-opacity">
			<rect x="165" y="442" width="170" height="24" rx="12" fill="#090d16" stroke="#10b981" stroke-width="1" />
			<text x="250" y="458" fill="#10b981" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle">
				💨 KLIK UNTUK NGEVAPE
			</text>
		</g>
	</svg>
</div>

<style>
	/* =========================================================================
	   REALISTIC VAPING ANIMATION TIMELINE (5.5s INFINITE LOOP)
	   
	   - BAHU (SHOULDER): 100% FIXED & DIAM (Berada di elemen torso statis)
	   - HINGE SIKU: Terletak di (350px, 395px)
	   - REST POSE (0s - 1.2s): rotate(-56deg)
	     Lengan bawah dan pod vape rileks di depan dada bagian bawah.
	   - VAPING POSE (1.8s - 2.8s): rotate(0deg)
	     Hanya lengan bawah dan vape yang terangkat ke atas siku.
	     Ujung drip tip vape mendarat PRESISI di bibir/mulut (250, 259).
	   - RETURN POSE (3.6s - 5.5s): rotate(-56deg)
	     Lengan bawah turun kembali ke posisi istirahat sambil asap mengepul.
	========================================================================= */

	.vaping-forearm-hinge {
		transform-origin: 360px 415px; /* PIVOT EKSKLUSIF DI SIKU, BAHU 100% DIAM */
		animation: forearmPivotCycle 5.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
	}

	@keyframes forearmPivotCycle {
		0%, 15% {
			/* REST POSE: Lengan bawah rileks di depan dada/perut, bahu tetap kokoh */
			transform: rotate(-44deg);
		}
		32%, 52% {
			/* VAPING POSE: Hanya lengan bawah dan vape terangkat ke mulut (250, 259) */
			transform: rotate(0deg);
		}
		70%, 100% {
			/* Kembali ke posisi istirahat */
			transform: rotate(-44deg);
		}
	}

	/* Head tilt when taking a pull */
	.character-head {
		transform-origin: 250px 282px;
		animation: headInhaleTilt 5.5s ease-in-out infinite;
	}

	@keyframes headInhaleTilt {
		0%, 18% {
			transform: rotate(0deg);
		}
		32%, 50% {
			transform: rotate(2deg) scale(1.015);
		}
		68%, 100% {
			transform: rotate(0deg);
		}
	}

	/* LED Glow on Vape firing button */
	.vape-led-glow {
		animation: podLedFire 5.5s ease-in-out infinite;
	}

	@keyframes podLedFire {
		0%, 28% {
			opacity: 0.2;
			transform: scale(0.85);
		}
		32%, 52% {
			opacity: 1;
			fill: #06b6d4;
			filter: drop-shadow(0 0 10px #06b6d4);
			transform: scale(1.5);
		}
		56%, 100% {
			opacity: 0.2;
			fill: #10b981;
			transform: scale(0.85);
		}
	}

	/* Mouth switching: Smile when idle, open "O" when blowing smoke */
	.mouth-smile {
		animation: mouthSmileCycle 5.5s ease-in-out infinite;
	}
	@keyframes mouthSmileCycle {
		0%, 30% {
			opacity: 1;
		}
		32%, 85% {
			opacity: 0;
		}
		90%, 100% {
			opacity: 1;
		}
	}

	.mouth-vape {
		animation: mouthVapeCycle 5.5s ease-in-out infinite;
	}
	@keyframes mouthVapeCycle {
		0%, 30% {
			opacity: 0;
			transform: scale(0.5);
		}
		33%, 85% {
			opacity: 1;
			transform: scale(1);
		}
		90%, 100% {
			opacity: 0;
			transform: scale(0.5);
		}
	}

	/* Eyes closed peacefully during deep pull */
	.eyes-vaping-inhale {
		animation: eyesInhaleCycle 5.5s ease-in-out infinite;
	}
	@keyframes eyesInhaleCycle {
		0%, 30% {
			opacity: 0;
		}
		33%, 54% {
			opacity: 1;
		}
		60%, 100% {
			opacity: 0;
		}
	}

	/* =========================================================================
	   VAPOR SMOKE BILLOWING ANIMATIONS
	========================================================================= */
	.vape-smoke-puff-1 {
		transform-origin: 250px 259px;
		animation: smokeCloud1 5.5s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
	}

	@keyframes smokeCloud1 {
		0%, 48% {
			opacity: 0;
			transform: translate(0, 0) scale(0.1);
		}
		55% {
			opacity: 0.95;
			transform: translate(14px, -14px) scale(0.7) rotate(10deg);
		}
		75% {
			opacity: 0.7;
			transform: translate(45px, -45px) scale(1.4) rotate(22deg);
		}
		92% {
			opacity: 0.15;
			transform: translate(72px, -75px) scale(2.1) rotate(35deg);
		}
		98%, 100% {
			opacity: 0;
			transform: translate(85px, -90px) scale(2.4);
		}
	}

	.vape-smoke-puff-2 {
		transform-origin: 255px 256px;
		animation: smokeCloud2 5.5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
	}

	@keyframes smokeCloud2 {
		0%, 52% {
			opacity: 0;
			transform: translate(0, 0) scale(0.1);
		}
		60% {
			opacity: 0.9;
			transform: translate(24px, -20px) scale(0.8) rotate(-12deg);
		}
		80% {
			opacity: 0.55;
			transform: translate(65px, -60px) scale(1.6) rotate(-28deg);
		}
		95% {
			opacity: 0.1;
			transform: translate(95px, -100px) scale(2.3) rotate(-40deg);
		}
		99%, 100% {
			opacity: 0;
			transform: translate(110px, -115px) scale(2.6);
		}
	}

	.vape-smoke-ring {
		transform-origin: 250px 259px;
		animation: smokeRingDrift 5.5s ease-out infinite;
	}

	@keyframes smokeRingDrift {
		0%, 55% {
			opacity: 0;
			transform: translate(-10px, 10px) scale(0.2) rotate(10deg);
		}
		63% {
			opacity: 0.85;
			transform: translate(20px, -28px) scale(0.6) rotate(15deg);
		}
		82% {
			opacity: 0.45;
			transform: translate(75px, -95px) scale(1.3) rotate(25deg);
		}
		96%, 100% {
			opacity: 0;
			transform: translate(120px, -155px) scale(1.8) rotate(35deg);
		}
	}

	.vape-smoke-trail {
		animation: smokeTrailFade 5.5s ease-out infinite;
	}

	@keyframes smokeTrailFade {
		0%, 50% {
			opacity: 0;
			stroke-dashoffset: 100;
		}
		55% {
			opacity: 0.8;
			stroke-dashoffset: 0;
		}
		75% {
			opacity: 0.3;
		}
		88%, 100% {
			opacity: 0;
		}
	}
</style>
