import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { redirect } from 'next/navigation';

export default async function AdminSettingsPage() {
    // Fetch current settings
    const settings = await prisma.systemSetting.findMany({
        where: {
            key: { in: ['BOOST_COOLDOWN', 'BOOST_WEIGHT'] }
        }
    });

    let boostCooldown = 60;
    let boostWeight = 10;

    settings.forEach(s => {
        if (s.key === 'BOOST_COOLDOWN') boostCooldown = s.value as number;
        if (s.key === 'BOOST_WEIGHT') boostWeight = s.value as number;
    });

    async function updateSettings(formData: FormData) {
        'use server';

        const schema = z.object({
            boostCooldown: z.coerce.number().min(1).max(3600),
            boostWeight: z.coerce.number().min(1).max(1000),
        });

        const data = schema.safeParse({
            boostCooldown: formData.get('boostCooldown'),
            boostWeight: formData.get('boostWeight'),
        });

        if (!data.success) {
            // Handle error (in a real app, return validation errors)
            throw new Error('Invalid input');
        }

        await prisma.systemSetting.upsert({
            where: { key: 'BOOST_COOLDOWN' },
            update: { value: data.data.boostCooldown },
            create: { key: 'BOOST_COOLDOWN', value: data.data.boostCooldown, description: 'Seconds to wait between boosts per IP' }
        });

        await prisma.systemSetting.upsert({
            where: { key: 'BOOST_WEIGHT' },
            update: { value: data.data.boostWeight },
            create: { key: 'BOOST_WEIGHT', value: data.data.boostWeight, description: 'Score multiplier for boosts' }
        });

        revalidatePath('/admin/settings');
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">System Settings</h1>

            <div className="bg-white rounded-lg shadow p-6 max-w-lg">
                <form action={updateSettings} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Boost Cooldown (Seconds)
                        </label>
                        <input
                            type="number"
                            name="boostCooldown"
                            defaultValue={boostCooldown}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                            max="3600"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Minimum time an IP must wait before boosting again.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Boost Weight
                        </label>
                        <input
                            type="number"
                            name="boostWeight"
                            defaultValue={boostWeight}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                            max="1000"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            How many points a &quot;Boost&quot; is worth compared to a &quot;View&quot;.
                        </p>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
