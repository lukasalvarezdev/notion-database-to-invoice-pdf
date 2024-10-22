import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { useLoaderData } from '@remix-run/react';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function loader() {
	const response = await notion.databases.query({
		database_id: process.env.NOTION_DATABASE_ID!,
	});
	const entries = response.results.filter(page => 'properties' in page) as PageObjectResponse[];
	type PropertyItem = PageObjectResponse['properties'][keyof PageObjectResponse['properties']];

	const days = entries
		.map(page => {
			const hours = extractNumber(page.properties.Hours);
			const date = extractDate(page.properties.Date);
			const title = extractTitle(page.properties.Task);
			let formattedDate = '';

			if (date) {
				const dateObj = new Date(date);
				dateObj.setDate(dateObj.getDate() + 1);
				formattedDate = formatDate(dateObj);
			}

			return { id: page.id, title, hours, date, formattedDate };
		})
		.filter(day => {
			if (!day.date) return false;

			// add 1 day to account for timezone differences
			const date = new Date(day.date);
			date.setDate(date.getDate() + 1);

			const now = new Date();
			return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
		})
		.sort((a, b) => {
			if (!a.date || !b.date) {
				return 0;
			}
			return new Date(a.date).getTime() - new Date(b.date).getTime();
		});
	const totalHours = days.reduce((acc, day) => acc + Number(day.hours || 0), 0);
	const hourlyRate = process.env.HOURLY_RATE ? Number(process.env.HOURLY_RATE) : 1;

	const config = {
		userName: process.env.USER_NAME,
		userIdNumber: process.env.USER_ID_NUMBER,
		userAddress: process.env.USER_ADDRESS,
		bankName: process.env.BANK_NAME,
		swiftCode: process.env.BANK_SWIFT_CODE,
		bankAccount: process.env.BANK_ACCOUNT_NUMBER,
		companyName: process.env.COMPANY_NAME,
		companyAddress: process.env.COMPANY_ADDRESS,
		invoiceNumber: process.env.INVOICE_NUMBER,
	};

	// next pay date is 15th of the next month
	const nextPayDate = new Date();
	nextPayDate.setDate(15);
	nextPayDate.setMonth(nextPayDate.getMonth() + 1);

	const currentDate = formatDate(new Date().toISOString());

	return {
		days,
		totalHours,
		total: totalHours * hourlyRate,
		config,
		hourlyRate,
		nextPayDate: formatDate(nextPayDate.toISOString()),
		currentDate,
	};

	function extractNumber(item: PropertyItem) {
		if (item && 'number' in item && typeof item.number === 'number') {
			return item.number;
		}

		return undefined;
	}

	function extractDate(item: PropertyItem) {
		if (item && 'date' in item && item.date?.start) {
			return item.date.start;
		}

		return undefined;
	}

	function extractTitle(item: PropertyItem) {
		if (
			item &&
			'title' in item &&
			item.title &&
			Array.isArray(item.title) &&
			item.title[0] &&
			item.title[0]?.plain_text
		) {
			return item.title[0].plain_text;
		}

		return undefined;
	}
}

export default function Component() {
	const { days, totalHours, total, config, hourlyRate, nextPayDate, currentDate } =
		useLoaderData<typeof loader>();

	return (
		<div className="bg-[#F5F5EF] w-full p-14">
			<div className=" h-svh relative">
				<div className="flex justify-end mb-14">
					<h1 className="font-serif">INVOICE</h1>
				</div>

				<div className="flex justify-between mb-14">
					<div>
						<h6>BILLED TO:</h6>
						<p>{config.companyName}</p>
						<p>{config.companyAddress}</p>
					</div>
					<div className="text-right">
						<p>Invoice No. {config.invoiceNumber}</p>
						<p>{currentDate}</p>
					</div>
				</div>

				<table className="w-full">
					<thead>
						<tr className="border-y border-black h-12 text-left">
							<th className="pl-4">Item</th>
							<th>Hourly Rate (USD)</th>
							<th>Hours</th>
							<th>Total</th>
						</tr>
					</thead>
					<tbody>
						<tr className="h-12 border-b border-black">
							<td className="pl-4">Frontend Developement</td>
							<td>{hourlyRate}$</td>
							<td>{totalHours}</td>
							<td>${total}</td>
						</tr>
					</tbody>
				</table>
				<div className="flex justify-end mt-4 pr-8 mb-20">
					<p className="text-xl font-bold flex gap-4">
						<span>Total:</span> <span>${total}</span>
					</p>
				</div>

				<div className="absolute left-0 bottom-24 w-full">
					<p className="text-3xl mb-20">Thank you!</p>

					<div className="flex justify-between items-end">
						<div>
							<p className="font-bold">PAYMENT INFORMATION</p>
							<p>Bank Name: {config.bankName}</p>
							<p>SWIFT Code: {config.swiftCode}</p>
							<p>Account No.: {config.bankAccount}</p>
							<p>Pay by: {nextPayDate}</p>
						</div>

						<div className="text-right">
							<p className="text-2xl font-serif">{config.userName}</p>
							<p>CC. {config.userIdNumber}</p>
							<p>{config.userAddress}</p>
						</div>
					</div>
				</div>
			</div>

			<div>
				<p className="text-2xl mb-4">Attachments</p>
			</div>

			<table className="w-full">
				<thead>
					<tr className="border-y border-black h-12 text-left">
						<th className="pl-4">Description</th>
						<th className="pl-4">Hours</th>
						<th className="pl-4">Date</th>
					</tr>
				</thead>
				<tbody>
					{days.map(day => (
						<tr key={day.id} className="border-b border-black break-inside-avoid-page">
							<td className="pl-4 py-2">{day.title}</td>
							<td className="pl-4">{day.hours}</td>
							<td className="whitespace-nowrap pl-4 py-2">{day.formattedDate}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function formatDate(date: string | Date) {
	if (typeof date === 'string') {
		date = new Date(date);
	}

	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}
