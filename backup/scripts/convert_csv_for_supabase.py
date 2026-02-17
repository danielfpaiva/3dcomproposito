#!/usr/bin/env python3
"""
Converte CSVs do Lovable para formato compatível com Supabase.

Problemas a resolver:
1. Delimitador: Lovable usa ';' → Supabase prefere ','
2. Arrays: Lovable usa '["item1","item2"]' → Supabase prefere '{item1,item2}'
3. Datas: Garantir formato ISO correto
"""

import csv
import re
import sys
from pathlib import Path

def convert_json_array_to_pg_array(value):
    """
    Converte array JSON ["item1","item2"] para array PostgreSQL {item1,item2}

    Exemplos:
    '["PETG","TPU"]' → '{PETG,TPU}'
    '["Bambu Lab A1","Bambu Lab A1 mini"]' → '{Bambu Lab A1,Bambu Lab A1 mini}'
    """
    if not value or value == '':
        return None

    # Remove aspas externas se existirem
    value = value.strip().strip('"')

    # Se não parece um array JSON, retorna como está
    if not (value.startswith('[') and value.endswith(']')):
        return value

    # Remove colchetes
    value = value[1:-1]

    # Se vazio, retorna array vazio PostgreSQL
    if not value.strip():
        return '{}'

    # Split por vírgulas, mas respeitando strings entre aspas
    items = []
    current_item = ''
    in_quotes = False

    for char in value:
        if char == '"':
            in_quotes = not in_quotes
        elif char == ',' and not in_quotes:
            if current_item.strip():
                items.append(current_item.strip().strip('"'))
            current_item = ''
        else:
            current_item += char

    # Adiciona o último item
    if current_item.strip():
        items.append(current_item.strip().strip('"'))

    # Cria array PostgreSQL, escapando vírgulas dentro dos items
    return '{' + ','.join(f'"{item}"' if ',' in item or ' ' in item else item for item in items) + '}'

def convert_csv(input_file, output_file=None):
    """Converte um ficheiro CSV do Lovable para Supabase."""

    if output_file is None:
        output_file = input_file.replace('.csv', '_supabase.csv')

    print(f"Convertendo {input_file} → {output_file}")

    # Colunas que contêm arrays
    array_columns = ['materials', 'printer_models']

    with open(input_file, 'r', encoding='utf-8') as infile:
        # Detecta o delimitador (Lovable usa ';')
        sample = infile.read(1024)
        infile.seek(0)

        delimiter = ';' if ';' in sample else ','

        reader = csv.DictReader(infile, delimiter=delimiter)
        fieldnames = reader.fieldnames

        rows_converted = []

        for row in reader:
            new_row = {}
            for key, value in row.items():
                # Converte arrays se a coluna está na lista
                if key in array_columns and value:
                    new_row[key] = convert_json_array_to_pg_array(value)
                else:
                    new_row[key] = value if value != '' else None
            rows_converted.append(new_row)

    # Escreve o novo CSV com vírgulas
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows_converted)

    print(f"✅ Convertido {len(rows_converted)} linhas")
    return len(rows_converted)

def main():
    backup_dir = Path(__file__).parent

    # Ficheiros a converter
    files_to_convert = [
        'contributors.csv',  # Tem arrays: materials, printer_models
        'profiles.csv',
        'user_roles.csv',
        'wheelchair_projects.csv',
        'part_templates.csv',
        'beneficiary_requests.csv',
    ]

    # Adiciona parts.csv se existir
    if (backup_dir / 'parts.csv').exists():
        files_to_convert.append('parts.csv')
    else:
        print("⚠️  parts.csv não encontrado - exporta do Lovable primeiro!")

    total_rows = 0

    for filename in files_to_convert:
        filepath = backup_dir / filename
        if filepath.exists():
            rows = convert_csv(str(filepath))
            total_rows += rows
        else:
            print(f"⚠️  {filename} não encontrado")

    print(f"\n✅ Total convertido: {total_rows} linhas")
    print("\nFicheiros gerados (sufixo _supabase.csv):")
    for f in backup_dir.glob('*_supabase.csv'):
        print(f"  - {f.name}")
    print("\nPróximo passo: Importa os ficheiros *_supabase.csv no Table Editor do Supabase")

if __name__ == '__main__':
    main()
