const parentVariants = {
	initial: {
		opacity: 0
	},
	animate: {
		opacity: 1,
		transition: {
			// Cria o efeito cascata: cada filho vai esperar 0.15s após o anterior para iniciar
			staggerChildren: 0.15,
			delayChildren: 0.2, // Um pequeno delay antes de começar a animar o primeiro filho
		},
	},
};

const itemVariants = {
	initial: {
		opacity: 0,
		y: 20 // Começa 20px abaixo
	},
	animate: {
		opacity: 1,
		y: 0, // Sobe para a posição original
		transition: {
			type: "spring", // Efeito elástico mais natural que um timer linear
			stiffness: 100,
			damping: 15
		}
	},
};
