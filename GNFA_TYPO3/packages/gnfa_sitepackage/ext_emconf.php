<?php

/**
 * Extension manifest for "gnfa_sitepackage".
 * Kept in sync with composer.json (extension-key: gnfa_sitepackage).
 */
$EM_CONF[$_EXTKEY] = [
    'title' => 'GNFA Sitepackage',
    'description' => 'Templates, layouts and assets for the Gerencia Nacional Financiera y Administrativa (UNAL) website.',
    'category' => 'templates',
    'author' => 'GNFA',
    'author_company' => 'Universidad Nacional de Colombia',
    'state' => 'stable',
    'version' => '1.0.0',
    'constraints' => [
        'depends' => [
            'typo3' => '13.4.0-13.4.99',
            'fluid_styled_content' => '13.4.0-13.4.99',
        ],
        'conflicts' => [],
        'suggests' => [],
    ],
];
