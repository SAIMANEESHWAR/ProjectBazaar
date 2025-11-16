import React from 'react';

const CheckIcon = () => (
    <svg className="w-5 h-5 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);

const CheckIconSimple = () => (
     <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);

const InfoIcon = () => (
    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);

const ToggleSwitch = () => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" value="" className="sr-only peer" defaultChecked />
    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
  </label>
);


const pricingPlans = [
    {
        name: 'Starter',
        price: 'Free',
        priceDetails: 'Up to 100 MAU',
        description: 'For developers getting started with Liveblocks.',
        buttonText: 'Sign up for free',
        isPopular: false,
        features: ['Realtime presence', 'Pre-built components', 'Community support']
    },
    {
        name: 'Pro',
        price: '$230',
        priceDetails: '/month',
        description: 'For companies adding collaboration in production.',
        buttonText: 'Sign up',
        isPopular: true,
        mau: '1,000 MAU included',
        mau_extra: 'Then $0.23 for each additional MAU',
        addOns: [
            { name: 'Comments', price: '$30/mo', iconGradient: 'from-orange-400 to-red-500' },
            { name: 'Notifications', price: '$20/mo', iconGradient: 'from-green-400 to-teal-500' },
            { name: 'Text Editor', price: '$80/mo', iconGradient: 'from-blue-400 to-indigo-500' },
            { name: 'Realtime APIs', price: '$80/mo', iconGradient: 'from-pink-400 to-purple-500' },
        ],
        included: ['Realtime presence', 'Pre-built components', 'Email support']
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        priceDetails: 'Custom MAU',
        description: 'For organizations with custom needs and advanced security.',
        buttonText: 'Contact us',
        isPopular: false,
        features: ['Comments', 'Notifications', 'Text Editor', 'Realtime APIs', 'Premium support', 'Volume discounts', '99.9% Uptime SLA', 'Private dedicated servers']
    }
];

const Pricing: React.FC = () => {
    return (
        <section className="py-20 bg-gray-50 dark:bg-black">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Pricing based on your success</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Choose the plan that's right for you. All plans come with our core features to help you get started.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                    {pricingPlans.map((plan, index) => (
                        <div key={index} className={`relative border rounded-2xl p-8 flex flex-col h-full ${plan.isPopular ? 'border-purple-500 dark:border-purple-400' : 'border-gray-200 dark:border-gray-800'} bg-white dark:bg-[#111111]`}>
                           
                           {plan.isPopular && (
                                <div className="absolute top-6 right-6">
                                    <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs font-semibold px-3 py-1 rounded-full uppercase">Most Popular</span>
                                </div>
                            )}

                           {plan.isPopular ? (
                                <>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{plan.description}</p>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                                    <div className="flex items-baseline mt-2 mb-2">
                                        <span className="text-5xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                                        <span className="ml-1 text-lg font-medium text-gray-500 dark:text-gray-400">{plan.priceDetails}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">{plan.mau} <InfoIcon /></p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{plan.mau_extra}</p>

                                    <div className="my-8 space-y-4">
                                        {plan.addOns?.map(addon => (
                                            <div key={addon.name} className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br ${addon.iconGradient} text-white font-bold text-sm`}>
                                                        {addon.name.charAt(0)}
                                                    </div>
                                                    <span className="ml-3 text-gray-700 dark:text-gray-300">{addon.name}</span>
                                                    <InfoIcon />
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">{addon.price}</span>
                                                    <ToggleSwitch />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <button className="w-full font-semibold py-3 px-6 rounded-lg transition-colors duration-300 bg-white dark:bg-gray-200 text-black hover:bg-gray-300 dark:hover:bg-gray-300">
                                        {plan.buttonText} &rarr;
                                    </button>

                                    <ul className="mt-6 space-y-3">
                                        {plan.included?.map(feature => (
                                            <li key={feature} className="flex items-center text-sm">
                                                <CheckIconSimple />
                                                <span className="ml-3 text-gray-600 dark:text-gray-400">{feature}</span>
                                                <InfoIcon />
                                            </li>
                                        ))}
                                    </ul>
                                </>
                           ) : (
                            <>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-12">{plan.description}</p>
                                <div className="flex-grow">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                                    <div className="flex items-baseline mt-4 mb-2">
                                        <span className="text-5xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">{plan.priceDetails} <InfoIcon /></p>
                                    
                                    <button className="w-full mt-8 font-semibold py-3 px-6 rounded-lg transition-colors duration-300 bg-gray-100 dark:bg-gray-800/80 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700/80">
                                        {plan.buttonText} &rarr;
                                    </button>

                                    <ul className="mt-8 space-y-3 pt-8 border-t border-gray-200 dark:border-gray-800">
                                        {plan.features?.map((feature, i) => (
                                            <li key={i} className="flex items-center text-sm">
                                                <CheckIconSimple />
                                                <span className="ml-3 text-gray-600 dark:text-gray-400">{feature}</span>
                                                <InfoIcon />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                           )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
