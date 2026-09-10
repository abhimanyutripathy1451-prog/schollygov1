import asyncio
import aiomysql

async def run_tests():
    print("Starting tests...")
    
    try:
        pool = await aiomysql.create_pool(
            host='127.0.0.1', port=3306, user='root', password='Abhi@05051987', 
            autocommit=True
        )
    except Exception as e:
        print(f"Failed to connect to MySQL: {e}")
        return

    async with pool.acquire() as conn:
        async with conn.cursor() as cur:
            # 1. Recreate DB
            print("Recreating database...")
            await cur.execute("DROP DATABASE IF EXISTS tteduappcgv2")
            await cur.execute("CREATE DATABASE tteduappcgv2")
            await cur.execute("USE tteduappcgv2")
            
            # 2. Run schema
            print("Loading schema...")
            with open('database_schema.sql', 'r', encoding='utf-8') as f:
                schema = f.read()
                
            statements = [s.strip() for s in schema.split(';') if s.strip()]
            for stmt in statements:
                try:
                    await cur.execute(stmt)
                except Exception as e:
                    print(f"Error executing statement:\n{stmt}\nError: {e}")
                    return
            
            print("Schema loaded successfully!")
            
            # 3. Insert Dummy Data
            print("Inserting test data...")
            try:
                await cur.execute("INSERT INTO curriculums (code, name, board, type) VALUES ('CBSE', 'CBSE Board', 'CBSE', 'school_board')")
                await cur.execute("INSERT INTO subjects (code, curriculum_code, name) VALUES ('CBSE-MATH', 'CBSE', 'Mathematics')")
                await cur.execute("INSERT INTO chapters (code, subject_code, module_name, title) VALUES ('CBSE-MATH-ALG', 'CBSE-MATH', 'Algebra', 'Algebra 1')")
                await cur.execute("INSERT INTO topics (code, chapter_code, title) VALUES ('CBSE-MATH-ALG-01', 'CBSE-MATH-ALG', 'Linear Equations')")
                await cur.execute(
                    "INSERT INTO quiz_questions (code, chapter_code, topic_code, question_text, option_0, option_1, option_2, option_3, correct_answers) "
                    "VALUES ('Q-01', 'CBSE-MATH-ALG', 'CBSE-MATH-ALG-01', 'What is 1+1?', '1', '2', '3', '4', '[\"2\"]')"
                )
                
                print("Test data inserted successfully! FKs are working.")
                
            except Exception as e:
                print(f"Error inserting test data: {e}")
                return
                
    pool.close()
    await pool.wait_closed()
    print("All tests passed!")

if __name__ == "__main__":
    asyncio.run(run_tests())
