import type { ApexOptions } from 'apexcharts';

const PIE_CHART_OPTIONS: ApexOptions = {
	chart: {
		type: 'pie',
		width: '100%',
		background: 'transparent',
		toolbar: {
			show: false,
		},
	},
	stroke: {
		colors: ['transparent'],
		lineCap: 'butt',
	},
	dataLabels: {
		enabled: true,
		style: {
			fontFamily: 'Inter, sans-serif',
		},
	},
	legend: {
		position: 'bottom',
		fontFamily: 'Inter, sans-serif',
	},
	responsive: [
		{
			breakpoint: 768,
			options: {
				chart: {
					width: '100%',
				},
				legend: {
					position: 'bottom',
				},
			},
		},
	],
};

const PIE_CHART_COLORS = [
	'#1C64F2',
	'#16BDCA',
	'#9061F9',
	'#E74694',
	'#FDBA8C',
	'#E55353',
	'#F9B115',
];

export { PIE_CHART_COLORS, PIE_CHART_OPTIONS };
